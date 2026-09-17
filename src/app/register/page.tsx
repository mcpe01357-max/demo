'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';

interface FormData {
  playerName: string;
  teamName: string;
  college: string;
}

interface FormErrors {
  playerName?: string;
  teamName?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ playerName: '', teamName: '', college: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.playerName.trim()) errs.playerName = 'Player name is required.';
    else if (form.playerName.trim().length < 2) errs.playerName = 'Name must be at least 2 characters.';
    if (!form.teamName.trim()) errs.teamName = 'Team name is required.';
    else if (form.teamName.trim().length < 2) errs.teamName = 'Team name must be at least 2 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/game/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: form.playerName.trim(),
          teamName: form.teamName.trim(),
          college: form.college.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Store session
      localStorage.setItem('cryptx_session', data.sessionId);
      localStorage.setItem('cryptx_player', JSON.stringify({
        playerName: data.playerName,
        teamName: data.teamName,
        sessionId: data.sessionId,
      }));

      router.push('/game');
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>⬡ CRYPTX</Link>
        <Link href="/how-to-play" className={styles.navLink}>How To Play</Link>
      </nav>

      <div className={styles.content}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div className={styles.leftBadge}>COMPETITION MODE</div>
          <h1 className={styles.leftTitle}>Join The<br/>Challenge</h1>
          <p className={styles.leftDesc}>
            Enter your details to register and join the live competition.
            Your session will be tracked for scoring and leaderboard ranking.
          </p>

          <div className={styles.infoCards}>
            {[
              { icon: '⏱️', title: '30 Minutes', sub: 'Total game time' },
              { icon: '🔐', title: '15 Challenges', sub: 'Across 5 levels' },
              { icon: '🏆', title: 'Live Ranking', sub: 'Real-time leaderboard' },
            ].map((c, i) => (
              <div key={i} className={styles.infoCard}>
                <span className={styles.infoIcon}>{c.icon}</span>
                <div>
                  <div className={styles.infoTitle}>{c.title}</div>
                  <div className={styles.infoSub}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.levelPreview}>
            <div className={styles.lpTitle}>LEVEL PROGRESSION</div>
            {[
              { n: 1, name: 'Code Breaker', color: '#00ff88' },
              { n: 2, name: 'Decoder', color: '#00f5ff' },
              { n: 3, name: 'Cipher Analyst', color: '#a855f7' },
              { n: 4, name: 'Cryptographer', color: '#ff9500' },
              { n: 5, name: 'Final Mission', color: '#ff3366' },
            ].map(l => (
              <div key={l.n} className={styles.lpRow}>
                <span className={styles.lpDot} style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }}></span>
                <span className={styles.lpLevel}>LVL {l.n}</span>
                <span className={styles.lpName} style={{ color: l.color }}>{l.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon}>👤</div>
              <h2 className={styles.formTitle}>Player Registration</h2>
              <p className={styles.formSubtitle}>One player per team. Register your team to begin.</p>
            </div>

            <form onSubmit={handleSubmit} id="registration-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="playerName">
                  Player Name *
                </label>
                <input
                  id="playerName"
                  type="text"
                  className={`form-input ${errors.playerName ? 'error' : ''}`}
                  placeholder="e.g. Alex Kumar"
                  value={form.playerName}
                  onChange={e => setForm(f => ({ ...f, playerName: e.target.value }))}
                  autoComplete="name"
                  maxLength={50}
                />
                {errors.playerName && <div className="form-error">{errors.playerName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="teamName">
                  Team Name *
                </label>
                <input
                  id="teamName"
                  type="text"
                  className={`form-input ${errors.teamName ? 'error' : ''}`}
                  placeholder="e.g. CYBER WARRIORS"
                  value={form.teamName}
                  onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                  maxLength={50}
                />
                {errors.teamName && <div className="form-error">{errors.teamName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="college">
                  College / Department <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="college"
                  type="text"
                  className="form-input"
                  placeholder="e.g. CSE Dept, MIT College"
                  value={form.college}
                  onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                  maxLength={100}
                />
              </div>

              {apiError && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  ⚠️ {apiError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                id="btn-register-submit"
                disabled={loading}
                style={{ width: '100%', fontSize: '1rem', padding: '16px' }}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Registering...
                  </>
                ) : (
                  '🚀 Register & Start Challenge'
                )}
              </button>
            </form>

            <div className={styles.formFooter}>
              <p>
                By registering, your score and team name will appear on the live leaderboard.
              </p>
              <div className={styles.footerLinks}>
                <Link href="/how-to-play">📖 Read the rules first</Link>
                <Link href="/leaderboard">🏆 View Leaderboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
