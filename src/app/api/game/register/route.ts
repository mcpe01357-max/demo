import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, teamName, college } = body;

    if (!playerName?.trim() || !teamName?.trim()) {
      return NextResponse.json({ error: 'Player name and team name are required.' }, { status: 400 });
    }

    const sessionId = randomUUID();

    // Check event settings
    const event = await prisma.eventSettings.findFirst();
    // If event exists but is explicitly ended, reject
    if (event?.isEnded) {
      return NextResponse.json({ error: 'The event has ended. No new registrations are allowed.' }, { status: 403 });
    }

    const player = await prisma.player.create({
      data: {
        sessionId,
        playerName: playerName.trim(),
        teamName: teamName.trim().toUpperCase(),
        college: college?.trim() || null,
        usedWords: '[]',
      },
    });

    // Ensure EventSettings exists
    await prisma.eventSettings.upsert({
      where: { id: 1 },
      create: { id: 1, updatedAt: new Date() },
      update: {},
    });

    return NextResponse.json({
      sessionId: player.sessionId,
      playerName: player.playerName,
      teamName: player.teamName,
      message: 'Registered successfully!',
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
