import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { refreshChannelCache } from '@/lib/discord/messageAggregationQueue';
import { Session } from 'next-auth';

// Helper: Check if user is a member of the server for a given channel
async function isUserAuthorizedForChannel(userId: string, channelId: string) {
  const channel = await prisma.discordChannel.findUnique({
    where: { id: channelId },
    select: { serverId: true },
  });
  if (!channel) return false;
  const membership = await prisma.serverUser.findUnique({
    where: { userId_serverId: { userId, serverId: channel.serverId } },
  });
  return !!membership;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { channelId, messageIds } = await req.json();
    if (!channelId || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Missing channelId or messageIds' }, { status: 400 });
    }
    // Authorization check
    const authorized = await isUserAuthorizedForChannel(userId, channelId);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Mark messages as read in MessageCache
    await prisma.messageCache.updateMany({
      where: {
        channelId,
        discordMsgId: { in: messageIds },
      },
      data: { isRead: true },
    });
    // Update LastRead for the user/channel
    const latestMessage = await prisma.messageCache.findFirst({
      where: {
        channelId,
        discordMsgId: { in: messageIds },
      },
      orderBy: { timestamp: 'desc' },
    });
    if (latestMessage) {
      await prisma.lastRead.upsert({
        where: { userId_channelId: { userId, channelId } },
        update: { lastReadAt: latestMessage.timestamp },
        create: { userId, channelId, lastReadAt: latestMessage.timestamp },
      });
    }
    // Refresh Redis cache for the channel
    await refreshChannelCache(channelId);
    // Return updated unread count
    const unreadCount = await prisma.messageCache.count({
      where: { channelId, isRead: false },
    });
    return NextResponse.json({ status: 'ok', channelId, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
    }
    // Authorization check
    const authorized = await isUserAuthorizedForChannel(userId, channelId);
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Try to get messages from Redis cache
    const redis = require('ioredis');
    const redisClient = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
    let messages: any[] = [];
    const cacheKey = `channel:${channelId}:messages`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      messages = JSON.parse(cached);
    } else {
      // Fallback: fetch from DB
      messages = await prisma.messageCache.findMany({
        where: { channelId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    }
    // Get unread status for this user
    const lastRead = await prisma.lastRead.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    const lastReadAt = lastRead?.lastReadAt;
    const messagesWithUnread = messages.map(msg => ({
      ...msg,
      unread: lastReadAt ? new Date(msg.timestamp) > lastReadAt : true,
    }));
    const unreadCount = messagesWithUnread.filter(m => m.unread).length;
    return NextResponse.json({
      status: 'ok',
      channelId,
      messages: messagesWithUnread,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 