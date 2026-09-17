import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateChallenge } from '@/lib/formulaEngine';

// GET /api/game/challenge?session=xxx
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session');
  if (!sessionId) return NextResponse.json({ error: 'Session required.' }, { status: 401 });

  const player = await prisma.player.findUnique({ where: { sessionId } });
  if (!player) return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
  if (!player.isActive) return NextResponse.json({ error: 'Session expired.' }, { status: 403 });

  const event = await prisma.eventSettings.findFirst();
  const totalChallenges = event?.totalChallenges ?? 15;

  // Check if game time is up
  if (event?.startTime && event.endTime && event.isStarted) {
    const now = new Date();
    if (now > event.endTime) {
      await prisma.player.update({
        where: { sessionId },
        data: { isActive: false, endTime: new Date() },
      });
      return NextResponse.json({ gameOver: true, reason: 'time_expired' });
    }
  }

  if (player.currentOrder > totalChallenges) {
    return NextResponse.json({ gameOver: true, reason: 'all_completed', score: player.score });
  }

  // Build the challenge dynamically
  const usedWords: string[] = JSON.parse(player.usedWords || '[]');
  const challenge = generateChallenge(player.currentOrder, usedWords);

  // Store the authoritative answer server-side
  await prisma.player.update({
    where: { sessionId },
    data: {
      // Add word to used list if it's new for this order
      usedWords: usedWords.length < player.currentOrder
        ? JSON.stringify([...usedWords, challenge.plaintext])
        : player.usedWords,
      currentChallengeAnswer: challenge.correctAnswer.toUpperCase(),
    },
  });

  // ⚠️ CRITICAL: NEVER return the correct answer or plaintext to the client
  const safeChallenge = {
    id: challenge.id,
    title: challenge.title,
    type: challenge.type,
    difficulty: challenge.difficulty,
    levelName: challenge.levelName,
    ciphertext: challenge.ciphertext,
    formula: challenge.formula,
    formulaDescription: challenge.formulaDescription,
    key: challenge.key,
    points: challenge.points,
    hints: challenge.hints,
    order: challenge.order,
    conceptName: challenge.conceptName,
  };

  return NextResponse.json({
    challenge: safeChallenge,
    playerState: {
      score: player.score,
      currentOrder: player.currentOrder,
      totalChallenges,
      completedCount: player.completedCount,
      attemptsTotal: player.attemptsTotal,
    },
    eventState: event ? {
      isStarted: event.isStarted,
      isPaused: event.isPaused,
      isEnded: event.isEnded,
      endTime: event.endTime,
      startTime: event.startTime,
    } : null,
  });
}
