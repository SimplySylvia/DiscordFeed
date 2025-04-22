import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';


// Get user preferences
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions) as Session | null;

    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to get preferences' },
        { status: 401 }
      );
    }

    // Get user preferences
    const preferences = await prisma.userPreference.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // Return preferences
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

// Update user preferences
export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions) as Session | null;

    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to update preferences' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate body
    if (
      typeof body.showUnreadOnly !== 'boolean' &&
      typeof body.notificationsEnabled !== 'boolean' &&
      typeof body.refreshInterval !== 'number' &&
      typeof body.theme !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid preference data' },
        { status: 400 }
      );
    }

    // Update preferences
    const preferences = await prisma.userPreference.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        ...(typeof body.showUnreadOnly === 'boolean' && {
          showUnreadOnly: body.showUnreadOnly,
        }),
        ...(typeof body.notificationsEnabled === 'boolean' && {
          notificationsEnabled: body.notificationsEnabled,
        }),
        ...(typeof body.refreshInterval === 'number' && {
          refreshInterval: body.refreshInterval,
        }),
        ...(typeof body.theme === 'string' && {
          theme: body.theme,
        }),
      },
      create: {
        userId: session.user.id,
        showUnreadOnly:
          typeof body.showUnreadOnly === 'boolean'
            ? body.showUnreadOnly
            : true,
        notificationsEnabled:
          typeof body.notificationsEnabled === 'boolean'
            ? body.notificationsEnabled
            : true,
        refreshInterval:
          typeof body.refreshInterval === 'number'
            ? body.refreshInterval
            : 300,
        theme: typeof body.theme === 'string' ? body.theme : 'system',
      },
    });

    // Return preferences
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
} 