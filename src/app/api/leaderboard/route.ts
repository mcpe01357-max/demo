import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/leaderboard - cached leaderboard
let leaderboardCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 10_000; // 10 seconds cache

export async function GET() {
  // Serve from cache if fresh
  if (leaderboardCache && Date.now() - leaderboardCache.timestamp < CACHE_TTL) {
    return NextResponse.json(leaderboardCache.data);
  }

  const players = await prisma.player.findMany({
    select: {
      playerName: true,
      teamName: true,
      score: true,
      completedCount: true,
      attemptsTotal: true,
      hintsTotal: true,
      startTime: true,
      endTime: true,
    },
    orderBy: [
      { score: 'desc' },
      { completedCount: 'desc' },
      { endTime: 'asc' },
    ],
  });

  const ranked = players.map((p, i) => ({
    rank: i + 1,
    playerName: p.playerName,
    teamName: p.teamName,
    score: p.score,
    completedCount: p.completedCount,
    attemptsTotal: p.attemptsTotal,
    timeTaken: p.endTime && p.startTime
      ? Math.floor((p.endTime.getTime() - p.startTime.getTime()) / 1000)
      : null,
  }));

  const data = { leaderboard: ranked, updatedAt: new Date().toISOString() };
  leaderboardCache = { data, timestamp: Date.now() };

  return NextResponse.json(data);
}
