import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { scheduleUserIndexing } from '../../../lib/discord/indexQueue';

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
    const result = await scheduleUserIndexing(token.sub);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering indexing:', error);
    return NextResponse.json(
      { error: 'Failed to schedule indexing' },
      { status: 500 }
    );
  }
}

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

    // For GET requests, just return a status message
    // In a real implementation, we might check the job status
    return NextResponse.json({
      message: 'Use POST to trigger indexing'
    });
  } catch (error) {
    console.error('Error checking indexing status:', error);
    return NextResponse.json(
      { error: 'Failed to check indexing status' },
      { status: 500 }
    );
  }
} 