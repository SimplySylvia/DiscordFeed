import Bull from 'bull';
import { prisma } from '../prisma';
import Redis from 'ioredis';
import { DiscordAPI } from './api';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

// Job data structure
interface MessageAggregationJob {
  channelId: string;
  userId?: string;
  lastFetchedAt?: string;
  priority?: number;
  attempt?: number;
}

// Create Bull queue
export const messageAggregationQueue = new Bull<MessageAggregationJob>('message-aggregation', redisUrl);

// Helper: Store messages in DB and update cache
async function storeMessagesAndUpdateCache(channelId: string, messages: any[]) {
  if (!messages.length) return;
  // Store in MessageCache (prisma)
  for (const msg of messages) {
    await prisma.messageCache.upsert({
      where: { discordMsgId: msg.id },
      update: {
        content: msg.content,
        authorId: msg.authorId,
        timestamp: msg.timestamp,
        attachments: msg.attachments,
        embeds: msg.embeds,
        reactions: msg.reactions,
      },
      create: {
        discordMsgId: msg.id,
        channelId,
        authorId: msg.authorId,
        content: msg.content,
        timestamp: msg.timestamp,
        attachments: msg.attachments,
        embeds: msg.embeds,
        reactions: msg.reactions,
      },
    });
  }
  // Update Redis cache (store latest N messages)
  await redis.set(`channel:${channelId}:messages`, JSON.stringify(messages.slice(-50)));
}

// Job processor: fetch-messages
messageAggregationQueue.process('fetch-messages', async (job) => {
  const { channelId, lastFetchedAt } = job.data;
  try {
    // Integrate Discord API call
    // For now, use a system userId or bot userId (replace with per-user tokens if needed)
    const systemUserId = process.env.DISCORD_BOT_USER_ID || process.env.SYSTEM_USER_ID || '';
    const discordApi = new DiscordAPI(systemUserId);
    // Fetch messages after lastFetchedAt if available, else fetch latest 50
    let messages: any[] = [];
    if (lastFetchedAt) {
      messages = await discordApi.fetchChannelMessages(channelId, { after: lastFetchedAt, limit: 50 });
    } else {
      messages = await discordApi.fetchChannelMessages(channelId, { limit: 50 });
    }

    console.log('messages', messages);
    // Store in DB and update cache
    await storeMessagesAndUpdateCache(channelId, messages);
    // TODO: Update lastFetchedAt in job data or DB if needed
    // TODO: Handle rate limits (track in Redis)
    return { status: 'fetched', channelId, count: messages.length };
  } catch (error: any) {
    // TODO: Handle errors, possibly re-queue with backoff
    return { status: 'error', channelId, error: error.message };
  }
});

// Helper: Refresh Redis cache for a channel (latest 50 messages)
export async function refreshChannelCache(channelId: string) {
  const messages = await prisma.messageCache.findMany({
    where: { channelId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
  await redis.set(`channel:${channelId}:messages`, JSON.stringify(messages));
  return messages.length;
}

// Job processor: refresh-cache
messageAggregationQueue.process('refresh-cache', async (job) => {
  const { channelId } = job.data;
  try {
    const count = await refreshChannelCache(channelId);
    return { status: 'cache-refreshed', channelId, count };
  } catch (error: any) {
    // Optionally, re-queue as retry-failed
    await messageAggregationQueue.add('retry-failed', { channelId, attempt: 1 });
    return { status: 'error', channelId, error: error.message };
  }
});

// Job processor: retry-failed
messageAggregationQueue.process('retry-failed', async (job) => {
  const { channelId, attempt = 1 } = job.data;
  const maxAttempts = 5;
  const delay = Math.min(2 ** attempt * 1000, 60000); // Exponential backoff, max 60s
  if (attempt > maxAttempts) {
    // Give up after max attempts
    // TODO: Log persistent failure for monitoring
    return { status: 'failed', channelId, attempt };
  }
  // Re-add the original job with incremented attempt count and delay
  await messageAggregationQueue.add('fetch-messages', { channelId, attempt: attempt + 1 }, { delay });
  return { status: 'retrying', channelId, attempt, nextDelay: delay };
});

messageAggregationQueue.process('priority-fetch', async (job) => {
  const { channelId, userId } = job.data;
  // TODO: Immediate fetch for high-priority channels (e.g., user is active)
  return { status: 'priority-fetched', channelId, userId };
});

// Fetch prioritized channels from the database (all channels, default priority 5)
async function getPrioritizedChannels() {
  const channels = await prisma.discordChannel.findMany();
  return channels.map(channel => ({
    channelId: channel.id,
    priority: 5, // You can adjust this logic as needed
  }));
}

// Helper: Convert priority to cron interval (example: higher priority = more frequent)
function priorityToCron(priority: number) {
  // Example: priority 10 = every minute, priority 5 = every 2 minutes, etc.
  const minutes = Math.max(Math.floor(10 / (priority || 1)), 1);
  return `*/${minutes} * * * *`;
}

// Schedule repeatable jobs for each channel
async function scheduleRepeatableFetchJobs() {
  const channels = await getPrioritizedChannels();
  for (const { channelId, priority } of channels) {
    const cron = priorityToCron(priority);
    // Use jobId to avoid duplicate repeatable jobs
    await messageAggregationQueue.add(
      'fetch-messages',
      { channelId, priority },
      {
        repeat: { cron },
        removeOnComplete: true,
        jobId: `fetch-messages-${channelId}`,
      }
    );
  }
}

// Run once at startup (and whenever priorities change)
scheduleRepeatableFetchJobs();
// Optionally, expose a function to re-run this when priorities/activity change

// Fetch channels without webhooks from the database (for now, same as all channels)
async function getChannelsWithoutWebhooks() {
  // TODO: Filter for channels without webhooks if you track this in your DB
  const channels = await prisma.discordChannel.findMany();
  return channels.map(channel => ({
    channelId: channel.id,
    priority: 5,
  }));
}

// Schedule repeatable polling jobs for channels without webhooks
async function scheduleFallbackPollingJobs() {
  const channels = await getChannelsWithoutWebhooks();
  for (const { channelId, priority } of channels) {
    const cron = priorityToCron(priority);
    await messageAggregationQueue.add(
      'fetch-messages',
      { channelId, priority },
      {
        repeat: { cron },
        removeOnComplete: true,
        jobId: `fallback-fetch-messages-${channelId}`,
      }
    );
  }
}

// Run fallback polling scheduler at startup (and whenever webhook/channel state changes)
scheduleFallbackPollingJobs();
// Optionally, expose a function to re-run this when webhook/channel state changes

// Export job types for use elsewhere
export const MessageAggregationJobTypes = {
  FETCH_MESSAGES: 'fetch-messages',
  REFRESH_CACHE: 'refresh-cache',
  RETRY_FAILED: 'retry-failed',
  PRIORITY_FETCH: 'priority-fetch',
} as const; 