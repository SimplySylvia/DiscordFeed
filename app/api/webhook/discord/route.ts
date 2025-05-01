import { NextRequest, NextResponse } from 'next/server';
import { messageAggregationQueue, MessageAggregationJobTypes } from '@/lib/discord/messageAggregationQueue';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function POST(req: NextRequest) {
  try {
    // TODO: Verify Discord webhook signature (security)
    // const signature = req.headers.get('x-signature-ed25519');
    // const timestamp = req.headers.get('x-signature-timestamp');
    // const isValid = verifyDiscordSignature(signature, timestamp, await req.text());
    // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

    const event = await req.json();
    const eventType = event.type || event.t; // Discord sends 'type' or 't' for event type
    const channelId = event.channel_id;

    if (!channelId) {
      return NextResponse.json({ error: 'Missing channel_id' }, { status: 400 });
    }

    // Handle MESSAGE_CREATE event
    if (eventType === 'MESSAGE_CREATE') {
      // Upsert message into MessageCache
      await prisma.messageCache.upsert({
        where: { discordMsgId: event.id },
        update: {
          content: event.content,
          authorId: event.author?.id || event.author_id,
          timestamp: new Date(event.timestamp),
          attachments: event.attachments,
          embeds: event.embeds,
          reactions: event.reactions,
        },
        create: {
          discordMsgId: event.id,
          channelId,
          authorId: event.author?.id || event.author_id,
          content: event.content,
          timestamp: new Date(event.timestamp),
          attachments: event.attachments,
          embeds: event.embeds,
          reactions: event.reactions,
        },
      });
      // Update Redis cache for this channel (latest 50 messages)
      const messages = await prisma.messageCache.findMany({
        where: { channelId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      await redis.set(`channel:${channelId}:messages`, JSON.stringify(messages));
      // Update unread status for all users in this channel
      const lastReads = await prisma.lastRead.findMany({ where: { channelId } });
      for (const lastRead of lastReads) {
        if (new Date(event.timestamp) > lastRead.lastReadAt) {
          // Mark this message as unread for the user
          await prisma.messageCache.update({
            where: { discordMsgId: event.id },
            data: { isRead: false },
          });
          // Optionally, notify the user or update a notification table
        }
      }
      // Note: This is a simple approach; for large channels, optimize with batch updates or triggers.
      return NextResponse.json({ status: 'message cached', channelId, messageId: event.id });
    }

    // For other event types, enqueue a refresh-cache job as fallback
    await messageAggregationQueue.add(MessageAggregationJobTypes.REFRESH_CACHE, { channelId }, { removeOnComplete: true });
    return NextResponse.json({ status: 'ok', channelId, eventType });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 