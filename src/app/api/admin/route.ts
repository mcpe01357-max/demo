import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return secret === (process.env.ADMIN_SECRET || 'cryptx-admin-2025');
}

// GET /api/admin - Get event state + all players
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [event, players] = await Promise.all([
    prisma.eventSettings.findFirst(),
    prisma.player.findMany({
      select: {
        id: true,
        playerName: true,
        teamName: true,
        college: true,
        score: true,
        completedCount: true,
        attemptsTotal: true,
        currentOrder: true,
        isActive: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { score: 'desc' },
    }),
  ]);

  return NextResponse.json({ event, players });
}

// POST /api/admin - Admin actions
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, durationMins, totalChallenges, eventName } = body;

  switch (action) {
    case 'start': {
      const dur = durationMins ?? 30;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + dur * 60_000);
      await prisma.eventSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          isStarted: true,
          isPaused: false,
          isEnded: false,
          durationMins: dur,
          startTime,
          endTime,
          totalChallenges: totalChallenges ?? 15,
          eventName: eventName ?? 'CRYPTX Challenge',
          updatedAt: new Date(),
        },
        update: {
          isStarted: true,
          isPaused: false,
          isEnded: false,
          durationMins: dur,
          startTime,
          endTime,
          totalChallenges: totalChallenges ?? 15,
          eventName: eventName ?? 'CRYPTX Challenge',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: `Event started. Ends at ${endTime.toISOString()}` });
    }

    case 'pause': {
      await prisma.eventSettings.update({ where: { id: 1 }, data: { isPaused: true, updatedAt: new Date() } });
      return NextResponse.json({ success: true, message: 'Event paused.' });
    }

    case 'resume': {
      await prisma.eventSettings.update({ where: { id: 1 }, data: { isPaused: false, updatedAt: new Date() } });
      return NextResponse.json({ success: true, message: 'Event resumed.' });
    }

    case 'end': {
      await prisma.eventSettings.update({
        where: { id: 1 },
        data: { isEnded: true, isPaused: false, isStarted: false, endTime: new Date(), updatedAt: new Date() },
      });
      // Deactivate all active players
      await prisma.player.updateMany({ where: { isActive: true }, data: { isActive: false, endTime: new Date() } });
      return NextResponse.json({ success: true, message: 'Event ended.' });
    }

    case 'reset': {
      await prisma.submission.deleteMany();
      await prisma.player.deleteMany();
      await prisma.rateLimit.deleteMany();
      await prisma.eventSettings.update({
        where: { id: 1 },
        data: { isStarted: false, isPaused: false, isEnded: false, startTime: null, endTime: null, updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Event reset. All players and scores cleared.' });
    }

    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }
}
