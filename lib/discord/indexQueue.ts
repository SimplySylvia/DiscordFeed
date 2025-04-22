import Queue from 'bull';
import { DiscordAPI, DiscordGuild, DiscordChannel } from './api';
import { prisma } from '../prisma';

// Create queues for different indexing tasks
export const indexUserQueue = new Queue('index-user', process.env.REDIS_URL || '');
export const indexGuildQueue = new Queue('index-guild', process.env.REDIS_URL || '');
export const indexChannelsQueue = new Queue('index-channels', process.env.REDIS_URL || '');

// Initialize indexing processors
export function initIndexingProcessors() {
  // User indexing processor
  indexUserQueue.process(async (job) => {
    const { userId } = job.data;

    console.log('Indexing user:', userId);
    console.log('Prisma:', prisma.user);

    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      console.log('User:', user);

      if (!user || !user.accessToken) {
        throw new Error(`User ${userId} not found or missing access token`);
      }

      // Initialize Discord API client
      const api = new DiscordAPI(userId);

      // Get guilds
      const guilds = await api.getGuilds();

      // Queue guild indexing jobs
      for (const guild of guilds) {
        await indexGuildQueue.add(
          {
            userId,
            guildId: guild.id,
            guildData: guild,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );
      }

      return { success: true, guildCount: guilds.length };
    } catch (error) {
      console.error(`Error indexing user ${userId}:`, error);
      throw error;
    }
  });

  // Guild indexing processor
  indexGuildQueue.process(async (job) => {
    const { userId, guildId, guildData } = job.data;

    try {
      // Store guild data
      await prisma.discordServer.upsert({
        where: { id: guildId },
        update: {
          name: guildData.name,
          icon: guildData.icon,
          members: {
            connectOrCreate: {
              where: {
                userId_serverId: {
                  userId,
                  serverId: guildId,
                },
              },
              create: {
                userId,
              },
            },
          },
        },
        create: {
          id: guildId,
          name: guildData.name,
          icon: guildData.icon,
          members: {
            create: {
              userId,
            },
          },
        },
      });

      // Queue channel indexing
      await indexChannelsQueue.add(
        {
          userId,
          guildId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );

      return { success: true, guildId };
    } catch (error) {
      console.error(`Error indexing guild ${guildId} for user ${userId}:`, error);
      throw error;
    }
  });

  // Channel indexing processor
  indexChannelsQueue.process(async (job) => {
    const { userId, guildId } = job.data;

    try {
      // Initialize Discord API client
      const api = new DiscordAPI(userId);

      // Get channels
      const channels = await api.getGuildChannels(guildId);

      // Store channels
      for (const channel of channels) {
        if (channel.type === 0 || channel.type === 2 || channel.type === 5) { // Text, Voice, Announcement
          await prisma.discordChannel.upsert({
            where: { id: channel.id },
            update: {
              name: channel.name,
              type: channel.type,
              parentId: channel.parent_id || null,
              position: channel.position,
            },
            create: {
              id: channel.id,
              name: channel.name,
              type: channel.type,
              serverId: guildId,
              parentId: channel.parent_id || null,
              position: channel.position,
            },
          });
        }
      }

      return { success: true, channelCount: channels.length };
    } catch (error) {
      console.error(`Error indexing channels for guild ${guildId} for user ${userId}:`, error);
      throw error;
    }
  });
}

// Export for use in API routes
export async function startUserIndexing(userId: string) {
  return indexUserQueue.add(
    { userId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );
} 