'use client';

import Link from 'next/link';
import styles from './how-to-play.module.css';

const STEPS = [
  {
    step: '01',
    title: 'Receive the Challenge',
    desc: 'You\'ll be given an encrypted message (ciphertext) and the transformation rule (formula) used to create it.',
    icon: '📨',
  },
  {
    step: '02',
    title: 'Identify the Rule',
    desc: 'Understand the formula — is it a shift cipher, a number encoding, binary, hex, or Base64?',
    icon: '🔍',
  },
  {
    step: '03',
    title: 'Apply the Inverse',
    desc: 'Reverse the transformation to recover the original plaintext. Use hints if you\'re stuck.',
    icon: '🔄',
  },
  {
    step: '04',
    title: 'Submit & Score',
    desc: 'Type your answer and submit. Correct answers earn points. Hints reduce your point total.',
    icon: '✅',
  },
];

const FORMULAS = [
  {
    name: 'SHIFT +3 (Caesar Cipher)',
    example: 'CODE → FRGH',
    desc: 'Move each letter 3 positions forward in the alphabet.',
    tag: 'ENCRYPTION',
    tagColor: '#00f5ff',
    category: 'Level 1–2',
  },
  {
    name: 'REVERSE ALPHABET (Atbash)',
    example: 'CODE → XLWV',
    desc: 'A↔Z, B↔Y, C↔X... Mirror each letter in the alphabet.',
    tag: 'ENCRYPTION',
    tagColor: '#00f5ff',
    category: 'Level 2',
  },
  {
    name: 'ALTERNATING SHIFT',
    example: 'CODE → EMFC (+2,-2,+2,-2)',
    desc: 'Odd letters shift +n, even letters shift -n.',
    tag: 'PATTERN',
    tagColor: '#a855f7',
    category: 'Level 2',
  },
  {
    name: 'INCREASING SHIFT',
    example: 'CODE → DQGI (+1,+2,+3,+4)',
    desc: 'The shift increases by 1 for each letter.',
    tag: 'PATTERN',
    tagColor: '#a855f7',
    category: 'Level 3',
  },
  {
    name: 'A1Z26',
    example: 'CODE → 3-15-4-5',
    desc: 'Replace each letter with its number: A=1, B=2...Z=26.',
    tag: 'ENCODING',
    tagColor: '#00ff88',
    category: 'Level 3',
  },
  {
    name: 'BINARY ENCODING',
    example: 'CODE → 01000011 01001111...',
    desc: 'Each letter becomes its 8-bit ASCII binary representation.',
    tag: 'ENCODING',
    tagColor: '#00ff88',
    category: 'Level 3',
  },
  {
    name: 'HEXADECIMAL',
    example: 'CODE → 43 4F 44 45',
    desc: 'Each letter is written as its hexadecimal ASCII code. This is ENCODING, not encryption.',
    tag: 'ENCODING',
    tagColor: '#00ff88',
    category: 'Level 3',
  },
  {
    name: 'BASE64',
    example: 'CRYPTO → Q1JZUFRP',
    desc: 'Data is encoded using 64 printable characters. This is ENCODING, not encryption!',
    tag: 'ENCODING',
    tagColor: '#00ff88',
    category: 'Level 3–4',
  },
  {
    name: 'XOR (Binary)',
    example: '1010 XOR 0110 = 1100',
    desc: 'Exclusive OR: same bits = 0, different bits = 1. Core to modern cryptography.',
    tag: 'ENCRYPTION',
    tagColor: '#ff9500',
    category: 'Level 4',
  },
  {
    name: 'MULTI-STEP',
    example: 'SHIFT +3 → REVERSE → SWAP PAIRS',
    desc: 'Multiple transformations applied in sequence. Undo them in reverse order.',
    tag: 'ADVANCED',
    tagColor: '#ff3366',
    category: 'Level 5',
  },
];

const TERMS = [
  { term: 'Plaintext', def: 'The original, readable information before any transformation.', example: 'HELLO' },
  { term: 'Ciphertext', def: 'The transformed output — the encrypted or encoded form.', example: 'KHOOR (shift +3)' },
  { term: 'Encryption', def: 'A cryptographic transformation that hides the meaning using a key. Requires the key to reverse.', example: 'Caesar Cipher, AES, RSA' },
  { term: 'Decryption', def: 'Recovering the original plaintext from ciphertext using the correct key or algorithm.', example: 'KHOOR → HELLO' },
  { term: 'Encoding', def: 'Converting data into another format for transmission or storage — NOT for security. Anyone can decode it without a key.', example: 'Base64, Hex, Binary' },
  { term: 'Decoding', def: 'Reversing an encoding to recover the original data.', example: 'Q1JZUFRP → CRYPTO' },
  { term: 'Key', def: 'The secret piece of information used by a cryptographic algorithm. Without the key, decryption is hard.', example: 'Shift = +3' },
  { term: 'Cipher', def: 'An algorithm for performing encryption and decryption.', example: 'Caesar Cipher, Vigenère, AES' },
  { term: 'Hashing', def: 'A one-way function that converts data to a fixed-size digest. Cannot be reversed.', example: 'MD5, SHA-256' },
];

export default function HowToPlayPage() {
  return (
    <main className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <span>⬡</span> CRYPTX
        </Link>
        <div className={styles.navActions}>
          <Link href="/register" className="btn btn-primary btn-sm">▶ Start Game</Link>
        </div>
      </nav>

      <div className="container-md">
        {/* Header */}
        <header className={styles.header}>
          <div className="badge badge-cyan">📖 GAME GUIDE</div>
          <h1 className={styles.title}>How To Play</h1>
          <p className={styles.subtitle}>
            Master cryptography fundamentals and defeat every challenge.
          </p>
        </header>

        {/* Flow Diagram */}
        <section className={`card ${styles.flowSection}`}>
          <h2 className={styles.sectionTitle}>The Encryption Flow</h2>
          <div className={styles.flow}>
            {[
              { label: 'PLAINTEXT', sub: 'Original message', icon: '📄', color: '#00ff88' },
              { label: 'ENCRYPT / ENCODE', sub: 'Apply transformation', icon: '⚙️', arrow: true, color: '#00f5ff' },
              { label: 'CIPHERTEXT', sub: 'Transformed output', icon: '🔐', color: '#a855f7' },
              { label: 'DECRYPT / DECODE', sub: 'Reverse the rule', icon: '🔓', arrow: true, color: '#ff9500' },
              { label: 'PLAINTEXT', sub: 'Recovered message', icon: '✅', color: '#00ff88' },
            ].map((item, i) => (
              <div key={i} className={styles.flowRow}>
                {item.arrow ? (
                  <div className={styles.flowArrow}>
                    <span className={styles.arrowIcon}>↓</span>
                    <span className={styles.arrowLabel} style={{ color: item.color }}>{item.label}</span>
                    <span className={styles.arrowSub}>{item.sub}</span>
                  </div>
                ) : (
                  <div className={styles.flowBox} style={{ borderColor: `${item.color}40`, background: `${item.color}08` }}>
                    <span className={styles.flowIcon}>{item.icon}</span>
                    <div>
                      <div className={styles.flowLabel} style={{ color: item.color }}>{item.label}</div>
                      <div className={styles.flowSub}>{item.sub}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Example */}
          <div className={styles.exampleBox}>
            <div className={styles.exampleRow}>
              <span className={styles.exLabel}>Plaintext</span>
              <span className={styles.exValue} style={{ color: '#00ff88' }}>HELLO</span>
            </div>
            <div className={styles.exampleArrow}>↓ SHIFT +3 ↓</div>
            <div className={styles.exampleRow}>
              <span className={styles.exLabel}>Ciphertext</span>
              <span className={styles.exValue} style={{ color: '#00f5ff' }}>KHOOR</span>
            </div>
            <div className={styles.exampleArrow}>↓ SHIFT -3 ↓</div>
            <div className={styles.exampleRow}>
              <span className={styles.exLabel}>Decrypted</span>
              <span className={styles.exValue} style={{ color: '#00ff88' }}>HELLO</span>
            </div>
          </div>
        </section>

        {/* Step by Step */}
        <section className={styles.stepsSection}>
          <h2 className={`${styles.sectionTitle} text-center`}>How Each Round Works</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s) => (
              <div key={s.step} className={styles.stepCard}>
                <div className={styles.stepNum}>{s.step}</div>
                <div className={styles.stepIcon}>{s.icon}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Important Distinction */}
        <section className={`card ${styles.importantBox}`}>
          <h2 className={styles.sectionTitle}>⚠️ Important: Encryption vs Encoding</h2>
          <div className={styles.vsGrid}>
            <div className={styles.vsCard} style={{ borderColor: 'rgba(0,245,255,0.3)' }}>
              <div className={styles.vsTitle} style={{ color: '#00f5ff' }}>🔐 Encryption</div>
              <ul className={styles.vsList}>
                <li>Requires a <strong>key</strong> to reverse</li>
                <li>Designed for <strong>security</strong></li>
                <li>Without key = cannot decrypt</li>
                <li>Examples: Caesar Cipher, AES, RSA</li>
              </ul>
            </div>
            <div className={styles.vsCenter}>VS</div>
            <div className={styles.vsCard} style={{ borderColor: 'rgba(0,255,136,0.3)' }}>
              <div className={styles.vsTitle} style={{ color: '#00ff88' }}>📡 Encoding</div>
              <ul className={styles.vsList}>
                <li><strong>No key</strong> needed to reverse</li>
                <li>Designed for <strong>compatibility</strong></li>
                <li>Anyone can decode it</li>
                <li>Examples: Base64, Hex, Binary</li>
              </ul>
            </div>
          </div>
          <div className="alert alert-warning mt-md">
            ⚠️ Base64 and Hexadecimal are NOT encryption. They are encoding formats and provide zero security on their own.
          </div>
        </section>

        {/* Formulas */}
        <section className={styles.formulasSection}>
          <h2 className={`${styles.sectionTitle} text-center`}>Formulas You&apos;ll Encounter</h2>
          <div className={styles.formulasGrid}>
            {FORMULAS.map((f, i) => (
              <div key={i} className={styles.formulaCard}>
                <div className={styles.formulaHeader}>
                  <span className={styles.formulaTag} style={{ color: f.tagColor, borderColor: f.tagColor }}>
                    {f.tag}
                  </span>
                  <span className={styles.formulaLevel}>{f.category}</span>
                </div>
                <h3 className={styles.formulaName}>{f.name}</h3>
                <div className={styles.formulaExample}>{f.example}</div>
                <p className={styles.formulaDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring */}
        <section className={`card ${styles.scoringSection}`}>
          <h2 className={styles.sectionTitle}>🏅 Points & Scoring</h2>
          <div className={styles.scoringGrid}>
            {[
              { level: 1, name: 'Code Breaker', pts: 5, color: '#00ff88' },
              { level: 2, name: 'Decoder', pts: 10, color: '#00f5ff' },
              { level: 3, name: 'Cipher Analyst', pts: 15, color: '#a855f7' },
              { level: 4, name: 'Cryptographer', pts: 20, color: '#ff9500' },
              { level: 5, name: 'Final Mission', pts: 30, color: '#ff3366' },
            ].map(s => (
              <div key={s.level} className={styles.scoringRow}>
                <div className={styles.scoringLevel} style={{ color: s.color }}>LEVEL {s.level}</div>
                <div className={styles.scoringName}>{s.name}</div>
                <div className={styles.scoringPts} style={{ color: s.color }}>+{s.pts} pts</div>
              </div>
            ))}
          </div>
          <div className={styles.hintPenalty}>
            <h3 className={styles.penaltyTitle}>Hint Penalties</h3>
            <div className={styles.penaltyRow}><span>No hint used</span><span className="glow-green">Full points</span></div>
            <div className={styles.penaltyRow}><span>Hint 1 used</span><span style={{ color: '#ff9500' }}>−20% points</span></div>
            <div className={styles.penaltyRow}><span>Hint 2 used</span><span style={{ color: '#ff9500' }}>−40% points</span></div>
            <div className={styles.penaltyRow}><span>Hint 3 used</span><span style={{ color: '#ff3366' }}>−60% points</span></div>
          </div>
        </section>

        {/* Terminology */}
        <section className={styles.termsSection}>
          <h2 className={`${styles.sectionTitle} text-center`}>📚 Cryptography Glossary</h2>
          <div className={styles.termsGrid}>
            {TERMS.map((t, i) => (
              <div key={i} className={styles.termCard}>
                <div className={styles.termName}>{t.term}</div>
                <div className={styles.termDef}>{t.def}</div>
                <div className={styles.termExample}>e.g. {t.example}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className={`text-center ${styles.ctaSection}`}>
          <h2 className={styles.ctaTitle}>Ready to Play?</h2>
          <div className={styles.ctaButtons}>
            <Link href="/register" className="btn btn-primary btn-lg" id="btn-start-game-htp">
              🚀 Start Challenge
            </Link>
            <Link href="/" className="btn btn-ghost btn-lg">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
