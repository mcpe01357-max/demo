import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/game/status?session=xxx — lightweight status check for timer sync
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session');
  if (!sessionId) return NextResponse.json({ error: 'Session required.' }, { status: 401 });

  const [player, event] = await Promise.all([
    prisma.player.findUnique({
      where: { sessionId },
      select: {
        score: true,
        completedCount: true,
        currentOrder: true,
        attemptsTotal: true,
        isActive: true,
      },
    }),
    prisma.eventSettings.findFirst({
      select: {
        isStarted: true,
        isPaused: true,
        isEnded: true,
        endTime: true,
        startTime: true,
        totalChallenges: true,
      },
    }),
  ]);

  if (!player) return NextResponse.json({ error: 'Player not found.' }, { status: 404 });

  return NextResponse.json({
    playerState: player,
    eventState: event,
    serverTime: new Date().toISOString(),
  });
}
