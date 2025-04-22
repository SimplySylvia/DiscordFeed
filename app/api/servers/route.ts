import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions) as Session | null;

    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to access this data' },
        { status: 401 }
      );
    }

    // Fetch servers the user belongs to, along with their channels
    const servers = await prisma.discordServer.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        channels: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    // For each channel, check if there are any unread messages (based on lastRead)
    const serversWithUnreadCounts = await Promise.all(
      servers.map(async (server) => {
        const channelsWithUnread = await Promise.all(
          server.channels.map(async (channel) => {
            // Get the last read timestamp for this channel
            const lastRead = await prisma.lastRead.findUnique({
              where: {
                userId_channelId: {
                  userId: session.user.id,
                  channelId: channel.id,
                },
              },
            });

            // For now, just return a random unread count since we don't actually fetch Discord messages yet
            // In Phase 2, this will be replaced with real message counts
            const unreadCount = lastRead ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 5);

            return {
              ...channel,
              unreadCount,
            };
          })
        );

        return {
          ...server,
          channels: channelsWithUnread,
        };
      })
    );

    console.log(serversWithUnreadCounts);

    return NextResponse.json({ servers: serversWithUnreadCounts });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
} 