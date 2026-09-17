'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './admin.module.css';

const ADMIN_SECRET = 'cryptx-admin-2025';

interface Player {
  id: string;
  playerName: string;
  teamName: string;
  college: string | null;
  score: number;
  completedCount: number;
  attemptsTotal: number;
  currentOrder: number;
  isActive: boolean;
  startTime: string;
  endTime: string | null;
}

interface EventSettings {
  id: number;
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  durationMins: number;
  startTime: string | null;
  endTime: string | null;
  totalChallenges: number;
  eventName: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [event, setEvent] = useState<EventSettings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [durationMins, setDurationMins] = useState(30);
  const [totalChallenges, setTotalChallenges] = useState(15);
  const [eventName, setEventName] = useState('CRYPTX Challenge 2025');
  const [activeTab, setActiveTab] = useState<'controls' | 'players' | 'leaderboard'>('controls');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEvent(data.event);
      setPlayers(data.players ?? []);
      if (data.event) {
        setDurationMins(data.event.durationMins);
        setTotalChallenges(data.event.totalChallenges);
        setEventName(data.event.eventName);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchData();
      const interval = setInterval(fetchData, 8000);
      return () => clearInterval(interval);
    }
  }, [authed, fetchData]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_SECRET) {
      setAuthed(true);
    } else {
      setPasswordError('Invalid admin password.');
    }
  }

  async function doAction(action: string, extra?: object) {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
        },
        body: JSON.stringify({ action, durationMins, totalChallenges, eventName, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message ?? 'Action completed.');
        setMessageType('success');
        await fetchData();
      } else {
        setMessage(data.error ?? 'Action failed.');
        setMessageType('error');
      }
    } catch {
      setMessage('Network error.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  }

  function getTimeLeft(): string {
    if (!event?.endTime) return '—';
    const remaining = Math.floor((new Date(event.endTime).getTime() - Date.now()) / 1000);
    if (remaining <= 0) return 'ENDED';
    return formatDuration(remaining);
  }

  // --- LOGIN SCREEN ---
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>🔐</div>
          <h1 className={styles.loginTitle}>ADMIN ACCESS</h1>
          <p className={styles.loginSubtitle}>CRYPTX Event Control Panel</p>
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Admin Password</label>
              <input
                id="admin-password"
                type="password"
                className={`form-input ${passwordError ? 'error' : ''}`}
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {passwordError && <div className="form-error">{passwordError}</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="btn-admin-login">
              🔓 Access Admin Panel
            </button>
          </form>
          <p className={styles.loginHint}>Default password: <code>cryptx-admin-2025</code></p>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className={styles.page}>
      <header className={styles.adminHeader}>
        <div className={styles.adminBrand}>⬡ CRYPTX <span>ADMIN</span></div>
        <div className={styles.adminStatus}>
          <div className={`${styles.statusDot} ${event?.isStarted && !event?.isPaused && !event?.isEnded ? styles.statusGreen : event?.isPaused ? styles.statusOrange : styles.statusRed}`}></div>
          <span>{event?.isEnded ? 'ENDED' : event?.isPaused ? 'PAUSED' : event?.isStarted ? 'LIVE' : 'STANDBY'}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData} id="btn-admin-refresh">🔄 Refresh</button>
      </header>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        {[
          { label: 'TOTAL PLAYERS', value: players.length },
          { label: 'ACTIVE', value: players.filter(p => p.isActive).length },
          { label: 'COMPLETED', value: players.filter(p => !p.isActive && p.completedCount > 0).length },
          { label: 'TOP SCORE', value: players.length > 0 ? Math.max(...players.map(p => p.score)) : 0 },
          { label: 'TIME LEFT', value: event?.isStarted ? getTimeLeft() : '—' },
          { label: 'CHALLENGES', value: `${event?.totalChallenges ?? 15}` },
        ].map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} ${styles.msgBanner}`}>
          {messageType === 'success' ? '✓' : '✗'} {message}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['controls', 'players', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            id={`btn-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'controls' ? '⚙️ Event Controls' : tab === 'players' ? '👥 Players' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {/* === CONTROLS TAB === */}
        {activeTab === 'controls' && (
          <div className={styles.controlsGrid}>
            {/* Event Config */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Event Configuration</h2>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-input"
                  id="input-event-name"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  id="input-duration"
                  min={5}
                  max={180}
                  value={durationMins}
                  onChange={e => setDurationMins(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Challenges</label>
                <input
                  type="number"
                  className="form-input"
                  id="input-challenges"
                  min={5}
                  max={30}
                  value={totalChallenges}
                  onChange={e => setTotalChallenges(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Event Controls */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Event Controls</h2>
              <div className={styles.controlButtons}>
                <button
                  className="btn btn-success"
                  id="btn-start-event"
                  disabled={loading || (event?.isStarted && !event?.isEnded)}
                  onClick={() => doAction('start')}
                >
                  ▶ START EVENT
                </button>
                <button
                  className="btn btn-outline"
                  id="btn-pause-event"
                  disabled={loading || !event?.isStarted || event?.isPaused || event?.isEnded}
                  onClick={() => doAction('pause')}
                >
                  ⏸ PAUSE
                </button>
                <button
                  className="btn btn-ghost"
                  id="btn-resume-event"
                  disabled={loading || !event?.isPaused}
                  onClick={() => doAction('resume')}
                >
                  ▶ RESUME
                </button>
                <button
                  className="btn btn-danger"
                  id="btn-end-event"
                  disabled={loading || !event?.isStarted || event?.isEnded}
                  onClick={() => {
                    if (confirm('End the event? This will stop all active sessions.')) doAction('end');
                  }}
                >
                  ⏹ END EVENT
                </button>
                <button
                  className="btn btn-danger"
                  id="btn-reset-event"
                  style={{ opacity: 0.7 }}
                  disabled={loading}
                  onClick={() => {
                    if (confirm('RESET everything? All player data will be permanently deleted!')) doAction('reset');
                  }}
                >
                  🗑 RESET ALL DATA
                </button>
              </div>

              {event && (
                <div className={styles.eventInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status</span>
                    <span style={{ color: event.isEnded ? '#ff3366' : event.isPaused ? '#ff9500' : event.isStarted ? '#00ff88' : '#7eb3d4' }}>
                      {event.isEnded ? 'ENDED' : event.isPaused ? 'PAUSED' : event.isStarted ? 'LIVE' : 'STANDBY'}
                    </span>
                  </div>
                  {event.startTime && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Started</span>
                      <span>{new Date(event.startTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {event.endTime && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Ends At</span>
                      <span>{new Date(event.endTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === PLAYERS TAB === */}
        {activeTab === 'players' && (
          <div className={styles.playersTable}>
            <div className={styles.tableHeader}>
              <div>PLAYER / TEAM</div>
              <div>COLLEGE</div>
              <div className={styles.center}>SCORE</div>
              <div className={styles.center}>CHALLENGE</div>
              <div className={styles.center}>ATTEMPTS</div>
              <div className={styles.center}>STATUS</div>
            </div>
            {players.length === 0 ? (
              <div className={styles.emptyMsg}>No players have registered yet.</div>
            ) : players.map(p => (
              <div key={p.id} className={styles.playerRow}>
                <div>
                  <div className={styles.playerName}>{p.teamName}</div>
                  <div className={styles.playerSub}>{p.playerName}</div>
                </div>
                <div className={styles.playerSub}>{p.college ?? '—'}</div>
                <div className={`${styles.center} ${styles.playerScore}`}>{p.score}</div>
                <div className={`${styles.center} ${styles.playerSub}`}>{p.currentOrder - 1}/{event?.totalChallenges ?? 15}</div>
                <div className={`${styles.center} ${styles.playerSub}`}>{p.attemptsTotal}</div>
                <div className={styles.center}>
                  <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>
                    {p.isActive ? 'ACTIVE' : 'DONE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === LEADERBOARD TAB === */}
        {activeTab === 'leaderboard' && (
          <div className={styles.playersTable}>
            <div className={`${styles.tableHeader} ${styles.lbHeader}`}>
              <div>RANK</div>
              <div>TEAM</div>
              <div className={styles.center}>SCORE</div>
              <div className={styles.center}>SOLVED</div>
              <div className={styles.center}>ATTEMPTS</div>
            </div>
            {[...players]
              .sort((a, b) => b.score - a.score || b.completedCount - a.completedCount)
              .map((p, i) => (
                <div key={p.id} className={styles.playerRow}>
                  <div className={styles.rankBadge}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div>
                    <div className={styles.playerName}>{p.teamName}</div>
                    <div className={styles.playerSub}>{p.playerName}</div>
                  </div>
                  <div className={`${styles.center} ${styles.playerScore}`}>{p.score}</div>
                  <div className={`${styles.center} ${styles.playerSub}`}>{p.completedCount}</div>
                  <div className={`${styles.center} ${styles.playerSub}`}>{p.attemptsTotal}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
