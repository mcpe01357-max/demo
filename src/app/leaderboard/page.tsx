'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './leaderboard.module.css';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  teamName: string;
  score: number;
  completedCount: number;
  attemptsTotal: number;
  timeTaken: number | null;
}

function formatTime(secs: number | null): string {
  if (secs === null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLORS: Record<number, string> = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' };

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setEntries(data.leaderboard ?? []);
      setUpdatedAt(data.updatedAt ?? '');
      setLastRefresh(Date.now());
    } catch {
      // fail silently on poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10_000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsAgo(lastRefresh ? Math.floor((Date.now() - lastRefresh) / 1000) : 0);
    }, 1000);
    return () => clearInterval(t);
  }, [lastRefresh]);

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>⬡ CRYPTX</Link>
        <div className={styles.navActions}>
          <Link href="/register" className="btn btn-primary btn-sm">▶ Play</Link>
        </div>
      </nav>

      <div className="container-md">
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className="badge badge-cyan">🏆 LIVE LEADERBOARD</div>
            <h1 className={styles.title}>Rankings</h1>
            <p className={styles.subtitle}>Updated every 10 seconds. Ranked by score, then completion time.</p>
          </div>
          <div className={styles.headerRight}>
            <button
              className="btn btn-ghost btn-sm"
              id="btn-refresh-leaderboard"
              onClick={fetchLeaderboard}
            >
              🔄 Refresh
            </button>
            <div className={styles.refreshInfo}>
              {secondsAgo}s ago
            </div>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <span>Loading rankings...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔐</div>
            <h2 className={styles.emptyTitle}>No players yet</h2>
            <p className={styles.emptyDesc}>Be the first to join and claim the top spot!</p>
            <Link href="/register" className="btn btn-primary mt-md" id="btn-leaderboard-play">
              🚀 Start Challenge
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className={styles.podium}>
                {[entries[1], entries[0], entries[2]].map((entry, i) => {
                  if (!entry) return null;
                  const order = [2, 1, 3][i];
                  const height = [180, 220, 160][i];
                  return (
                    <div key={entry.rank} className={styles.podiumItem} style={{ order: i }}>
                      <div className={styles.podiumAvatar}>
                        {RANK_ICONS[order] ?? order}
                      </div>
                      <div className={styles.podiumTeam} style={{ color: RANK_COLORS[order] }}>
                        {entry.teamName}
                      </div>
                      <div className={styles.podiumScore}>{entry.score}</div>
                      <div className={styles.podiumBase} style={{
                        height: `${height}px`,
                        background: `linear-gradient(180deg, ${RANK_COLORS[order]}22 0%, transparent 100%)`,
                        borderTop: `2px solid ${RANK_COLORS[order]}`,
                        borderColor: RANK_COLORS[order],
                      }}>
                        <span className={styles.podiumRank} style={{ color: RANK_COLORS[order] }}>#{order}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>RANK</div>
                <div>TEAM</div>
                <div className={styles.colCenter}>SCORE</div>
                <div className={styles.colCenter}>SOLVED</div>
                <div className={styles.colRight}>TIME</div>
              </div>

              {entries.map(entry => (
                <div
                  key={entry.teamName}
                  className={`${styles.tableRow} ${
                    entry.rank === 1 ? styles.rowGold :
                    entry.rank === 2 ? styles.rowSilver :
                    entry.rank === 3 ? styles.rowBronze : ''
                  }`}
                  id={`row-rank-${entry.rank}`}
                >
                  <div className={styles.rankCell}>
                    <span style={{ color: RANK_COLORS[entry.rank] ?? '#7eb3d4', fontSize: entry.rank <= 3 ? '1.2rem' : '1rem' }}>
                      {RANK_ICONS[entry.rank] ?? `#${entry.rank}`}
                    </span>
                  </div>
                  <div className={styles.teamCell}>
                    <div className={styles.teamCellName}>{entry.teamName}</div>
                    <div className={styles.teamCellPlayer}>{entry.playerName}</div>
                  </div>
                  <div className={`${styles.scoreCell} ${styles.colCenter}`}>{entry.score}</div>
                  <div className={`${styles.solvedCell} ${styles.colCenter}`}>{entry.completedCount}</div>
                  <div className={`${styles.timeCell} ${styles.colRight}`}>{formatTime(entry.timeTaken)}</div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <p>Tie-breaking: Score → Challenges Completed → Completion Time</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
