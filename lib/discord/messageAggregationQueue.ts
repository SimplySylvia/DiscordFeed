import Bull from 'bull';
import { prisma } from '../prisma';
import Redis from 'ioredis';
// import { fetchMessagesFromDiscord } from './api'; // Integration point for Discord.js
import { setInterval } from 'timers';

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
    // TODO: Replace with actual Discord API call
    // const messages: MessageType[] = await fetchMessagesFromDiscord(channelId, lastFetchedAt);
    const messages: any[] = [];
    // Example message structure for placeholder
    // messages = [{ id, authorId, content, timestamp, attachments, embeds, reactions }]

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

// Job processor: refresh-cache
messageAggregationQueue.process('refresh-cache', async (job) => {
  const { channelId } = job.data;
  try {
    // Load latest 50 messages from DB
    const messages = await prisma.messageCache.findMany({
      where: { channelId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    // Update Redis cache
    await redis.set(`channel:${channelId}:messages`, JSON.stringify(messages));
    return { status: 'cache-refreshed', channelId, count: messages.length };
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

// Placeholder: Fetch prioritized channels (to be replaced with real logic)
async function getPrioritizedChannels() {
  // TODO: Integrate with user preferences and activity tracking
  // Example: Fetch channels sorted by priority and recent activity
  // Return array of { channelId, priority }
  return [
    { channelId: 'channel1', priority: 10 },
    { channelId: 'channel2', priority: 5 },
    // ...
  ];
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

// Fallback polling for channels without webhook support

// Placeholder: Identify channels without webhooks (to be replaced with real logic)
async function getChannelsWithoutWebhooks() {
  // TODO: Integrate with channel metadata and webhook tracking in DB
  // Return array of { channelId, priority }
  return [
    { channelId: 'channel3', priority: 3 },
    { channelId: 'channel4', priority: 2 },
    // ...
  ];
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