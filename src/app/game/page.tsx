'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './game.module.css';

// Types (mirror from formulaEngine, but no sensitive fields)
interface SafeChallenge {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  levelName: string;
  ciphertext: string;
  formula: string;
  formulaDescription: string;
  key?: string | number;
  points: number;
  hints: [string, string, string];
  order: number;
  explanation?: string;
  conceptName?: string;
}

interface PlayerState {
  score: number;
  currentOrder: number;
  totalChallenges: number;
  completedCount: number;
  attemptsTotal?: number;
}

interface EventState {
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  endTime: string | null;
  startTime: string | null;
}

interface SubmitResult {
  correct: boolean;
  pointsAwarded?: number;
  totalScore?: number;
  completedCount?: number;
  nextOrder?: number;
  gameOver?: boolean;
  explanation?: string;
  conceptName?: string;
  correctAnswer?: string;
  formulaDescription?: string;
  attemptCount?: number;
  message?: string;
  error?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#00ff88',
  2: '#00f5ff',
  3: '#a855f7',
  4: '#ff9500',
  5: '#ff3366',
};

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  encryption: '🔐 ENCRYPTION',
  encoding: '📡 ENCODING',
  pattern: '🧩 PATTERN',
  multi_step: '⚡ MULTI-STEP',
  decrypt_letter: '🔤 LETTER',
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function GamePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerInfo, setPlayerInfo] = useState<{ playerName: string; teamName: string } | null>(null);
  const [challenge, setChallenge] = useState<SafeChallenge | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(1800);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [incorrectShake, setIncorrectShake] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameOver, setGameOver] = useState<{ reason: string; score?: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load session from localStorage
  useEffect(() => {
    const sid = localStorage.getItem('cryptx_session');
    const info = localStorage.getItem('cryptx_player');
    if (!sid) { router.replace('/register'); return; }
    setSessionId(sid);
    if (info) setPlayerInfo(JSON.parse(info));
  }, [router]);

  // Fetch current challenge
  const fetchChallenge = useCallback(async (sid: string) => {
    setLoading(true);
    setError('');
    setAnswer('');
    setHintsUsed(0);
    setRevealedHints([]);
    setSubmitResult(null);
    setShowExplanation(false);
    setAttempts(0);

    try {
      const res = await fetch(`/api/game/challenge?session=${sid}`);
      const data = await res.json();

      if (data.gameOver) {
        setGameOver({ reason: data.reason, score: data.score });
        return;
      }

      setChallenge(data.challenge);
      setPlayerState(data.playerState);
      if (data.eventState) setEventState(data.eventState);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setError('Failed to load challenge. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) fetchChallenge(sessionId);
  }, [sessionId, fetchChallenge]);

  // Timer (client-side countdown, synced to event endTime)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (eventState?.endTime) {
      const update = () => {
        const remaining = Math.floor((new Date(eventState.endTime!).getTime() - Date.now()) / 1000);
        setTimeRemaining(Math.max(0, remaining));
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          setGameOver({ reason: 'time_expired' });
        }
      };
      update();
      timerRef.current = setInterval(update, 1000);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [eventState?.endTime]);

  // Submit answer
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || !sessionId || !challenge || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: answer.trim(), hintsUsed }),
      });

      const data: SubmitResult = await res.json();

      if (data.gameOver && !data.correct) {
        setGameOver({ reason: 'time_expired' });
        return;
      }

      setSubmitResult(data);

      if (data.correct) {
        setPlayerState(prev => prev ? {
          ...prev,
          score: data.totalScore ?? prev.score,
          completedCount: data.completedCount ?? prev.completedCount,
          currentOrder: (data.nextOrder ?? prev.currentOrder),
        } : prev);
        setShowExplanation(true);
        if (data.gameOver) {
          setTimeout(() => setGameOver({ reason: 'completed', score: data.totalScore }), 2500);
        }
      } else {
        setAttempts(a => a + 1);
        setIncorrectShake(true);
        setTimeout(() => setIncorrectShake(false), 500);
      }
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Reveal hint
  function handleUseHint() {
    if (hintsUsed >= 3 || !challenge) return;
    setShowHintConfirm(false);
    const nextHint = challenge.hints[hintsUsed];
    setRevealedHints(h => [...h, nextHint]);
    setHintsUsed(h => h + 1);
  }

  // Next challenge
  function handleNext() {
    if (sessionId) fetchChallenge(sessionId);
  }

  const timerClass = timeRemaining <= 60
    ? styles.timerCritical
    : timeRemaining <= 300
    ? styles.timerWarning
    : styles.timerNormal;

  const progressPct = playerState
    ? (playerState.completedCount / playerState.totalChallenges) * 100
    : 0;

  const levelColor = challenge ? LEVEL_COLORS[challenge.difficulty] ?? '#00f5ff' : '#00f5ff';

  // ---- GAME OVER SCREEN ----
  if (gameOver) {
    return (
      <div className={styles.gameOverPage}>
        <div className={styles.gameOverCard}>
          <div className={styles.gameOverIcon}>
            {gameOver.reason === 'completed' ? '🏆' : '⏱️'}
          </div>
          <h1 className={styles.gameOverTitle}>
            {gameOver.reason === 'completed' ? 'CHALLENGE COMPLETE!' : 'TIME\'S UP!'}
          </h1>
          {playerInfo && <div className={styles.gameOverTeam}>{playerInfo.teamName}</div>}
          <div className={styles.gameOverStats}>
            <div className={styles.goStat}>
              <div className={styles.goStatValue} style={{ color: '#ffd700' }}>
                {playerState?.score ?? gameOver.score ?? 0}
              </div>
              <div className={styles.goStatLabel}>FINAL SCORE</div>
            </div>
            <div className={styles.goStat}>
              <div className={styles.goStatValue} style={{ color: '#00f5ff' }}>
                {playerState?.completedCount ?? 0}
              </div>
              <div className={styles.goStatLabel}>COMPLETED</div>
            </div>
            <div className={styles.goStat}>
              <div className={styles.goStatValue} style={{ color: '#00ff88' }}>
                {playerState?.completedCount && playerState?.attemptsTotal
                  ? Math.round((playerState.completedCount / playerState.attemptsTotal) * 100)
                  : 100}%
              </div>
              <div className={styles.goStatLabel}>ACCURACY</div>
            </div>
          </div>
          <div className={styles.gameOverButtons}>
            <button
              className="btn btn-primary btn-lg"
              id="btn-view-leaderboard"
              onClick={() => router.push('/leaderboard')}
            >
              🏆 View Leaderboard
            </button>
            <button
              className="btn btn-ghost"
              id="btn-go-home"
              onClick={() => router.push('/')}
            >
              ← Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gamePage}>
      {/* TOP HEADER BAR */}
      <header className={styles.gameHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.teamName}>{playerInfo?.teamName ?? '...'}</div>
          <div className={styles.playerName}>{playerInfo?.playerName}</div>
        </div>

        <div className={styles.headerCenter}>
          <div className={`${styles.timer} ${timerClass}`}>
            {timeRemaining <= 300 && <span className={styles.timerIcon}>⚠️</span>}
            {formatTime(timeRemaining)}
          </div>
          {timeRemaining <= 300 && timeRemaining > 0 && (
            <div className={styles.timerWarningText}>
              {timeRemaining <= 60 ? '⚡ FINAL MINUTE!' : '⏰ Less than 5 minutes!'}
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreLabel}>SCORE</span>
            <span className={styles.scoreValue}>{playerState?.score ?? 0}</span>
          </div>
          <div className={styles.challengeCounter}>
            {playerState?.completedCount ?? 0} / {playerState?.totalChallenges ?? 15}
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className={styles.progressRow}>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <span className={styles.progressLabel}>{Math.round(progressPct)}% complete</span>
      </div>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Generating Challenge...</div>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <div className="alert alert-error">{error}</div>
            <button className="btn btn-outline mt-md" onClick={() => sessionId && fetchChallenge(sessionId)}>
              🔄 Retry
            </button>
          </div>
        ) : challenge ? (
          <div className={styles.challengeLayout}>
            {/* LEFT: Challenge Info */}
            <div className={styles.challengeMain}>
              {/* Challenge Header */}
              <div className={styles.challengeHeader}>
                <div className={styles.challengeMeta}>
                  <span
                    className={styles.challengeType}
                    style={{ color: levelColor, borderColor: `${levelColor}40` }}
                  >
                    {CHALLENGE_TYPE_LABELS[challenge.type] ?? challenge.type.toUpperCase()}
                  </span>
                  <span className={styles.challengeDiff} style={{ color: levelColor }}>
                    ● {challenge.levelName.toUpperCase()}
                  </span>
                  <span className={styles.challengePoints}>+{challenge.points} pts</span>
                </div>
                <h1 className={styles.challengeTitle}>
                  #{challenge.order} — {challenge.title}
                </h1>
              </div>

              {/* Cipher Display */}
              <div className={styles.cipherSection}>
                <div className={styles.cipherLabel}>ENCRYPTED MESSAGE</div>
                <div className={`cipher-display ${incorrectShake ? 'animate-shake' : ''}`}>
                  {challenge.ciphertext}
                </div>
              </div>

              {/* Formula */}
              <div className={styles.formulaSection}>
                <div className={styles.formulaLabel}>FORMULA / RULE</div>
                <div className={styles.formulaValue}>{challenge.formulaDescription}</div>
                {challenge.key !== undefined && (
                  <div className={styles.formulaKey}>
                    KEY: <span style={{ color: '#ffd700' }}>{challenge.key}</span>
                  </div>
                )}
              </div>

              {/* Hints revealed */}
              {revealedHints.length > 0 && (
                <div className={styles.hintsArea}>
                  {revealedHints.map((h, i) => (
                    <div key={i} className={styles.hintItem}>
                      <span className={styles.hintNum}>HINT {i + 1}</span>
                      <span className={styles.hintText}>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer form OR Explanation */}
              {showExplanation && submitResult?.correct ? (
                <div className={styles.explanationCard}>
                  <div className={styles.correctBanner}>
                    <span className={styles.correctIcon}>✓</span>
                    <div>
                      <div className={styles.correctTitle}>CORRECT!</div>
                      <div className={styles.correctPoints}>+{submitResult.pointsAwarded} POINTS</div>
                    </div>
                  </div>

                  <div className={styles.explanationBody}>
                    <div className={styles.expSection}>
                      <span className={styles.expLabel}>ANSWER</span>
                      <span className={styles.expValue} style={{ color: '#00ff88' }}>
                        {submitResult.correctAnswer}
                      </span>
                    </div>
                    <div className={styles.expSection}>
                      <span className={styles.expLabel}>CONCEPT</span>
                      <span className={styles.expValue}>{submitResult.conceptName}</span>
                    </div>
                    <div className={styles.expSection}>
                      <span className={styles.expLabel}>EXPLANATION</span>
                      <p className={styles.expText}>{submitResult.explanation}</p>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    id="btn-next-challenge"
                    onClick={handleNext}
                    style={{ width: '100%', marginTop: '16px' }}
                  >
                    NEXT CHALLENGE →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.answerForm} id="answer-form">
                  <div className={styles.answerLabel}>YOUR ANSWER</div>
                  {submitResult && !submitResult.correct && (
                    <div className={`alert alert-error ${styles.feedbackBanner}`}>
                      ✗ Incorrect. Try again! {attempts >= 2 && '(Hint available)'}
                    </div>
                  )}
                  <div className={styles.answerRow}>
                    <input
                      ref={inputRef}
                      type="text"
                      className={`form-input ${styles.answerInput}`}
                      placeholder="Type your answer..."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      id="answer-input"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="btn-submit-answer"
                      disabled={!answer.trim() || submitting}
                    >
                      {submitting ? (
                        <span className={styles.submitSpinner}></span>
                      ) : 'SUBMIT'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* RIGHT: Sidebar */}
            <aside className={styles.sidebar}>
              {/* Hint panel */}
              {!showExplanation && (
                <div className={styles.hintPanel}>
                  <div className={styles.hintPanelTitle}>💡 HINTS</div>
                  <div className={styles.hintPointsNote}>
                    {hintsUsed === 0 && <span className="glow-green">Full points</span>}
                    {hintsUsed === 1 && <span style={{ color: '#ff9500' }}>-20% points</span>}
                    {hintsUsed === 2 && <span style={{ color: '#ff9500' }}>-40% points</span>}
                    {hintsUsed === 3 && <span style={{ color: '#ff3366' }}>-60% points</span>}
                  </div>

                  {[0, 1, 2].map(i => (
                    <div key={i} className={styles.hintSlot}>
                      {i < hintsUsed ? (
                        <div className={styles.hintUsed}>
                          <span className={styles.hintUsedIcon}>🔓</span>
                          <span className={styles.hintUsedLabel}>Hint {i + 1} Used</span>
                        </div>
                      ) : (
                        <button
                          className={`btn btn-ghost btn-sm ${styles.hintBtn}`}
                          id={`btn-hint-${i + 1}`}
                          disabled={hintsUsed !== i || showExplanation}
                          onClick={() => setShowHintConfirm(true)}
                        >
                          🔒 Hint {i + 1}
                          {hintsUsed === i && <span className={styles.hintCost}> (-{[20, 20, 20][i]}%)</span>}
                        </button>
                      )}
                    </div>
                  ))}

                  {showHintConfirm && (
                    <div className={styles.hintConfirm}>
                      <p>Using a hint reduces your points. Are you sure?</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button className="btn btn-danger btn-sm" id="btn-hint-confirm" onClick={handleUseHint}>
                          Yes, show hint
                        </button>
                        <button className="btn btn-ghost btn-sm" id="btn-hint-cancel" onClick={() => setShowHintConfirm(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress tracker */}
              <div className={styles.progressPanel}>
                <div className={styles.progressPanelTitle}>PROGRESS</div>
                <div className={styles.progressMini}>
                  {Array.from({ length: playerState?.totalChallenges ?? 15 }, (_, i) => {
                    const order = i + 1;
                    const done = order < (playerState?.currentOrder ?? 1);
                    const current = order === (playerState?.currentOrder ?? 1);
                    return (
                      <div
                        key={i}
                        className={`${styles.progressDot} ${done ? styles.dotDone : current ? styles.dotCurrent : ''}`}
                        title={`Challenge ${order}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Reference: Alphabet */}
              <div className={styles.alphaRef}>
                <div className={styles.alphaTitle}>ALPHABET REFERENCE</div>
                <div className={styles.alphaGrid}>
                  {Array.from({ length: 26 }, (_, i) => (
                    <div key={i} className={styles.alphaCell}>
                      <div className={styles.alphaLetter}>{String.fromCharCode(65 + i)}</div>
                      <div className={styles.alphaNum}>{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
