import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateChallenge, validateAnswer, calculatePoints } from '@/lib/formulaEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, answer, hintsUsed } = body;

    if (!sessionId) return NextResponse.json({ error: 'Session required.' }, { status: 401 });
    if (!answer?.trim()) return NextResponse.json({ error: 'Answer cannot be empty.' }, { status: 400 });

    // Rate limiting: max 10 submissions per 30 seconds
    const windowStart = new Date(Date.now() - 30_000);
    await prisma.rateLimit.deleteMany({
      where: { sessionId, endpoint: 'submit', windowStart: { lt: new Date(Date.now() - 60_000) } },
    });
    const rlRecord = await prisma.rateLimit.findFirst({
      where: { sessionId, endpoint: 'submit', windowStart: { gte: windowStart } },
    });
    if (rlRecord) {
      if (rlRecord.count >= 10) {
        return NextResponse.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 });
      }
      await prisma.rateLimit.update({ where: { id: rlRecord.id }, data: { count: { increment: 1 } } });
    } else {
      await prisma.rateLimit.create({ data: { sessionId, endpoint: 'submit' } });
    }

    const player = await prisma.player.findUnique({ where: { sessionId } });
    if (!player) return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    if (!player.isActive) return NextResponse.json({ error: 'Session has ended.' }, { status: 403 });

    const event = await prisma.eventSettings.findFirst();
    const totalChallenges = event?.totalChallenges ?? 15;

    // Check event end time
    if (event?.endTime && new Date() > event.endTime && event.isStarted) {
      await prisma.player.update({
        where: { sessionId },
        data: { isActive: false, endTime: new Date() },
      });
      return NextResponse.json({ gameOver: true, reason: 'time_expired' });
    }

    if (player.currentOrder > totalChallenges) {
      return NextResponse.json({ alreadyCompleted: true });
    }

    // Use the server-stored correct answer for validation (most reliable)
    const storedAnswer = player.currentChallengeAnswer;
    if (!storedAnswer) {
      return NextResponse.json({ error: 'Challenge not loaded. Please refresh.' }, { status: 400 });
    }

    const isCorrect = validateAnswer(answer, storedAnswer);
    const hintsCount = Math.min(3, Math.max(0, Number(hintsUsed) || 0));

    // Count previous attempts on this challenge order
    const prevAttempts = await prisma.submission.count({
      where: { playerId: player.id, challengeOrder: player.currentOrder },
    });
    const attemptCount = prevAttempts + 1;

    // Re-generate challenge to get metadata for explanation (safe to do after validation)
    const usedWords: string[] = JSON.parse(player.usedWords || '[]');
    const priorWords = usedWords.slice(0, player.currentOrder - 1);
    const challenge = generateChallenge(player.currentOrder, priorWords);

    const pointsAwarded = isCorrect
      ? calculatePoints(challenge.points, hintsCount, attemptCount)
      : 0;

    // Save submission
    await prisma.submission.create({
      data: {
        playerId: player.id,
        challengeId: challenge.id,
        challengeOrder: player.currentOrder,
        answer: answer.trim().toUpperCase(),
        isCorrect,
        hintsUsed: hintsCount,
        attemptCount,
        pointsAwarded,
      },
    });

    if (isCorrect) {
      const newOrder = player.currentOrder + 1;
      const isLastChallenge = player.currentOrder >= totalChallenges;

      await prisma.player.update({
        where: { sessionId },
        data: {
          score: { increment: pointsAwarded },
          completedCount: { increment: 1 },
          currentOrder: { increment: 1 },
          attemptsTotal: { increment: 1 },
          currentChallengeAnswer: null, // Clear after use
          endTime: isLastChallenge ? new Date() : undefined,
          isActive: !isLastChallenge,
        },
      });

      return NextResponse.json({
        correct: true,
        pointsAwarded,
        totalScore: player.score + pointsAwarded,
        completedCount: player.completedCount + 1,
        nextOrder: newOrder,
        gameOver: isLastChallenge,
        explanation: challenge.explanation,
        conceptName: challenge.conceptName,
        correctAnswer: storedAnswer, // Reveal ONLY after correct submission
        formulaDescription: challenge.formulaDescription,
      });
    } else {
      await prisma.player.update({
        where: { sessionId },
        data: { attemptsTotal: { increment: 1 } },
      });

      return NextResponse.json({
        correct: false,
        attemptCount,
        message: 'Incorrect. Try again!',
      });
    }
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
