import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { startUserIndexing } from '../../../lib/discord/indexQueue';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user from the JWT token
    const token = await getToken({ req });

    if (!token || !token.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user has any servers indexed
    const serverCount = await prisma.serverUser.count({
      where: {
        userId: token.sub,
      },
    });

    // If no servers or very few servers, indexing is needed
    const needsIndexing = serverCount < 1;

    return NextResponse.json({
      needsIndexing,
      serverCount,
      message: needsIndexing ? 'Indexing recommended' : 'Servers already indexed'
    });
  } catch (error) {
    console.error('Error checking indexing status:', error);
    return NextResponse.json(
      { error: 'Failed to check indexing status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from the JWT token
    const token = await getToken({ req });

    if (!token || !token.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Schedule indexing for the user
    const result = await startUserIndexing(token.sub);

    return NextResponse.json({
      message: 'Indexing started',
      jobId: result.id
    });
  } catch (error) {
    console.error('Error triggering indexing:', error);
    return NextResponse.json(
      { error: 'Failed to schedule indexing' },
      { status: 500 }
    );
  }
} 