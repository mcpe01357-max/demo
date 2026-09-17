'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

function MatrixRain() {
  const [columns, setColumns] = useState<Array<{ chars: string[]; opacity: number[] }>>([]);

  useEffect(() => {
    const count = Math.floor(window.innerWidth / 22);
    const cols = Array.from({ length: count }, () => ({
      chars: Array.from({ length: 20 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
      opacity: Array.from({ length: 20 }, (_, i) => Math.max(0, 0.8 - i * 0.05)),
    }));
    setColumns(cols);

    const interval = setInterval(() => {
      setColumns(prev => prev.map(col => ({
        chars: [MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], ...col.chars.slice(0, -1)],
        opacity: col.opacity,
      })));
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.matrixContainer} aria-hidden="true">
      {columns.map((col, ci) => (
        <div key={ci} className={styles.matrixCol}>
          {col.chars.map((char, ri) => (
            <span key={ri} style={{ opacity: col.opacity[ri] }}>{char}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

const ROTATING_WORDS = ['ENCRYPT', 'DECODE', 'CIPHER', 'SECURE', 'ANALYZE', 'PROTECT'];

export default function HomePage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setStatsVisible(true), 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className={styles.home}>
      <MatrixRain />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>⬡</span>
          <span>CRYPTX</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/how-to-play" className={styles.navLink}>How To Play</Link>
          <Link href="/leaderboard" className={styles.navLink}>Leaderboard</Link>
          <Link href="/admin" className={styles.navLink}>Admin</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge} style={{ animationDelay: '0.1s' }}>
            <span className={styles.badgeDot}></span>
            CYBERSECURITY COMPETITION 2025
          </div>

          <h1 className={styles.heroTitle} style={{ animationDelay: '0.2s' }}>
            CRYPT<span className={styles.titleAccent}>X</span>
          </h1>

          <p className={styles.heroSubtitle} style={{ animationDelay: '0.3s' }}>
            THE ENCRYPTION &amp; DECODING CHALLENGE
          </p>

          <div className={styles.heroTagline} style={{ animationDelay: '0.4s' }}>
            <span className={styles.taglinePrefix}>&gt;</span>
            <span
              className={styles.taglineWord}
              style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
            <span className={styles.taglineSuffix}>. Think Beyond.</span>
          </div>

          <p className={styles.heroDescription} style={{ animationDelay: '0.5s' }}>
            Decode hidden messages, identify patterns, apply cryptographic rules,
            and compete against other teams in the ultimate encryption challenge.
          </p>

          <div className={styles.heroButtons} style={{ animationDelay: '0.6s' }}>
            <Link href="/register" className="btn btn-primary btn-lg" id="btn-start-game">
              🚀 &nbsp;START GAME
            </Link>
            <Link href="/how-to-play" className="btn btn-outline btn-lg" id="btn-how-to-play">
              📖 &nbsp;HOW TO PLAY
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost btn-lg" id="btn-leaderboard">
              🏆 &nbsp;LEADERBOARD
            </Link>
          </div>
        </div>

        {/* Terminal Preview */}
        <div className={styles.terminalPreview} style={{ animationDelay: '0.7s' }}>
          <div className={styles.terminalHeader}>
            <span className={styles.dot} style={{ background: '#ff5f57' }}></span>
            <span className={styles.dot} style={{ background: '#febc2e' }}></span>
            <span className={styles.dot} style={{ background: '#28c840' }}></span>
            <span className={styles.terminalTitle}>cryptx — challenge.exe</span>
          </div>
          <div className={styles.terminalBody}>
            <div className={styles.termLine}><span className={styles.termPrompt}>&gt;</span> CHALLENGE: Caesar Cipher</div>
            <div className={styles.termLine}><span className={styles.termPrompt}>&gt;</span> RULE: SHIFT +3</div>
            <div className={styles.termLine}>&nbsp;</div>
            <div className={styles.termLine + ' ' + styles.cipherLine}>KHOOR</div>
            <div className={styles.termLine}>&nbsp;</div>
            <div className={styles.termLine}><span className={styles.termPrompt}>&gt;</span> YOUR ANSWER: <span className={styles.termCursor}>_</span></div>
            <div className={styles.termLine + ' ' + styles.successLine}>✓ CORRECT! +10 POINTS</div>
            <div className={styles.termLine}><span className={styles.termPrompt}>&gt;</span> CONCEPT: Caesar Cipher (Julius Caesar, 50 BC)</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`${styles.stats} ${statsVisible ? styles.statsVisible : ''}`}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { value: '15+', label: 'Challenges', icon: '🔐' },
              { value: '200+', label: 'Players', icon: '👥' },
              { value: '30', label: 'Minutes', icon: '⏱️' },
              { value: '5', label: 'Levels', icon: '⚡' },
            ].map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>What You&apos;ll Face</h2>
          <div className="grid-3" style={{ marginTop: '48px' }}>
            {[
              {
                icon: '🔐',
                title: 'Real Encryption',
                desc: 'Caesar ciphers, Atbash, XOR, and multi-step transformations used by real cryptographers.',
                badge: 'ENCRYPTION',
                color: '#00f5ff',
              },
              {
                icon: '📡',
                title: 'Encoding Challenges',
                desc: 'Base64, Binary, Hexadecimal — learn the difference between encoding and encryption.',
                badge: 'ENCODING',
                color: '#a855f7',
              },
              {
                icon: '🧩',
                title: 'Pattern Discovery',
                desc: 'Alternating shifts, increasing sequences — identify the pattern before you decrypt.',
                badge: 'PATTERNS',
                color: '#00ff88',
              },
              {
                icon: '⚡',
                title: 'Multi-Step Missions',
                desc: 'Chain multiple transformations. Undo them in the right order to reveal the secret.',
                badge: 'ADVANCED',
                color: '#ff9500',
              },
              {
                icon: '🏆',
                title: 'Live Leaderboard',
                desc: 'Compete in real-time. Rankings update live. Every second counts.',
                badge: 'COMPETITIVE',
                color: '#ffd700',
              },
              {
                icon: '💡',
                title: 'Learn As You Play',
                desc: 'Every correct answer reveals the concept behind it — a built-in cryptography course.',
                badge: 'EDUCATIONAL',
                color: '#ff3366',
              },
            ].map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureBadge} style={{ color: f.color, borderColor: f.color }}>
                  {f.badge}
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className={styles.ctaTitle}>Ready to Decrypt?</h2>
          <p className={styles.ctaDesc}>
            Enter your name, join your team, and start cracking codes.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg" id="btn-cta-register">
            🔓 &nbsp;JOIN THE CHALLENGE
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container text-center">
          <p className={styles.footerText}>
            CRYPTX — The Encryption &amp; Decoding Challenge &nbsp;|&nbsp;
            <span className={styles.footerAccent}>Encrypt. Decode. Think Beyond.</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
