// ============================================================
// CRYPTX — FORMULA ENGINE
// All cryptographic & encoding transformations live here.
// ============================================================

export type FormulaType =
  | 'shift_fixed'
  | 'shift_random'
  | 'shift_alternating'
  | 'shift_increasing'
  | 'shift_decreasing'
  | 'reverse_alphabet'
  | 'swap_pairs'
  | 'a1z26_encode'
  | 'a1z26_decode'
  | 'xor_binary'
  | 'base64_encode'
  | 'base64_decode'
  | 'binary_encode'
  | 'binary_decode'
  | 'hex_encode'
  | 'hex_decode'
  | 'multi_step';

export type ChallengeType = 'encryption' | 'encoding' | 'pattern' | 'multi_step' | 'decrypt_letter';

export interface Formula {
  id: FormulaType;
  name: string;
  description: string;
  category: 'encryption' | 'encoding';
  difficulty: number; // 1–5
}

export interface Challenge {
  id: string;
  title: string;
  type: ChallengeType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  levelName: string;
  plaintext: string;
  ciphertext: string;
  formula: FormulaType;
  formulaDescription: string;
  key?: string | number;
  points: number;
  hints: [string, string, string];
  correctAnswer: string;
  order: number;
  steps?: Array<{ formula: FormulaType; key?: number; result: string; description: string }>;
  // Explanation fields
  explanation: string;
  conceptName: string;
}

// ---- ALPHABET HELPERS ----
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function charShift(char: string, shift: number): string {
  const upper = char.toUpperCase();
  if (!ALPHA.includes(upper)) return char;
  const idx = ALPHA.indexOf(upper);
  const newIdx = ((idx + shift) % 26 + 26) % 26;
  return ALPHA[newIdx];
}

function reverseAlphabetChar(char: string): string {
  const upper = char.toUpperCase();
  if (!ALPHA.includes(upper)) return char;
  return ALPHA[25 - ALPHA.indexOf(upper)];
}

// ---- FORMULA IMPLEMENTATIONS ----

// Formula 1 & 3: Fixed/Random Shift
export function applyShift(text: string, shift: number): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => charShift(c, shift))
    .join('');
}

// Formula 4: Alternating Shift (+n, -n, +n, -n)
export function applyAlternatingShift(text: string, shift: number): string {
  return text
    .toUpperCase()
    .split('')
    .map((c, i) => {
      if (!ALPHA.includes(c)) return c;
      return charShift(c, i % 2 === 0 ? shift : -shift);
    })
    .join('');
}

// Formula 5: Increasing Shift (+1, +2, +3...)
export function applyIncreasingShift(text: string): string {
  let alphaIdx = 0;
  return text
    .toUpperCase()
    .split('')
    .map(c => {
      if (!ALPHA.includes(c)) return c;
      const shifted = charShift(c, alphaIdx + 1);
      alphaIdx++;
      return shifted;
    })
    .join('');
}

// Formula 6: Decreasing Shift (-1, -2, -3...)
export function applyDecreasingShift(text: string): string {
  let alphaIdx = 0;
  return text
    .toUpperCase()
    .split('')
    .map(c => {
      if (!ALPHA.includes(c)) return c;
      const shifted = charShift(c, -(alphaIdx + 1));
      alphaIdx++;
      return shifted;
    })
    .join('');
}

// Formula 7: Reverse Alphabet (A↔Z, B↔Y...)
export function applyReverseAlphabet(text: string): string {
  return text.toUpperCase().split('').map(reverseAlphabetChar).join('');
}

// Formula 8: Swap Pairs (SE → ES)
export function applySwapPairs(text: string): string {
  const t = text.toUpperCase();
  const chars = t.split('');
  for (let i = 0; i + 1 < chars.length; i += 2) {
    if (ALPHA.includes(chars[i]) || ALPHA.includes(chars[i + 1])) {
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    }
  }
  return chars.join('');
}

// Formula 9: A1Z26 (letters to numbers)
export function applyA1Z26Encode(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => {
      if (!ALPHA.includes(c)) return c;
      return String(ALPHA.indexOf(c) + 1);
    })
    .join('-');
}

export function applyA1Z26Decode(numbers: string): string {
  return numbers
    .split('-')
    .map(n => {
      const num = parseInt(n, 10);
      if (isNaN(num) || num < 1 || num > 26) return '?';
      return ALPHA[num - 1];
    })
    .join('');
}

// Formula 10: XOR on small binary strings
export function generateXORChallenge(): { a: string; b: string; result: string } {
  const len = 4;
  const a = Array.from({ length: len }, () => Math.round(Math.random())).join('');
  const b = Array.from({ length: len }, () => Math.round(Math.random())).join('');
  const result = a.split('').map((bit, i) => (parseInt(bit) ^ parseInt(b[i])).toString()).join('');
  return { a, b, result };
}

// Encoding: Base64
export function applyBase64Encode(text: string): string {
  return Buffer.from(text.toUpperCase(), 'utf-8').toString('base64');
}

export function applyBase64Decode(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

// Encoding: Binary
export function applyBinaryEncode(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

export function applyBinaryDecode(binary: string): string {
  return binary
    .trim()
    .split(' ')
    .map(b => String.fromCharCode(parseInt(b, 2)))
    .join('');
}

// Encoding: Hex
export function applyHexEncode(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

export function applyHexDecode(hex: string): string {
  return hex
    .trim()
    .split(' ')
    .map(h => String.fromCharCode(parseInt(h, 16)))
    .join('');
}

// ---- LEVEL NAMES ----
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Code Breaker',
  2: 'Decoder',
  3: 'Cipher Analyst',
  4: 'Cryptographer',
  5: 'Final Mission',
};

export const LEVEL_POINTS: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 30,
};

// ---- WORD POOL (100+ words) ----
export const WORD_POOL = [
  'CODE', 'KEY', 'DATA', 'SECURE', 'SECRET', 'CIPHER', 'CRYPTO', 'NETWORK',
  'SERVER', 'CLIENT', 'PASSWORD', 'FIREWALL', 'PROTOCOL', 'DIGITAL', 'BINARY',
  'SYSTEM', 'ACCESS', 'LOGIN', 'ENCRYPT', 'DECRYPT', 'HASH', 'TRUST',
  'SIGNATURE', 'PRIVACY', 'SECURITY', 'ALGORITHM', 'MATRIX', 'PACKET',
  'SOFTWARE', 'HARDWARE', 'DATABASE', 'IDENTITY', 'CERTIFICATE', 'INTERNET',
  'COMPUTER', 'PROGRAM', 'PYTHON', 'LOGIC', 'VECTOR', 'MATH', 'BYTE', 'BIT',
  'STREAM', 'BLOCK', 'TOKEN', 'SESSION', 'COOKIE', 'PROXY', 'SOCKET',
  'ROUTER', 'SWITCH', 'BRIDGE', 'GATEWAY', 'SUBNET', 'DOMAIN', 'HOSTING',
  'CLOUD', 'KERNEL', 'THREAD', 'PROCESS', 'MEMORY', 'BUFFER', 'STACK',
  'HEAP', 'QUEUE', 'ARRAY', 'INDEX', 'POINTER', 'CLASS', 'OBJECT', 'METHOD',
  'FUNCTION', 'VARIABLE', 'CONSTANT', 'BOOLEAN', 'INTEGER', 'STRING', 'FLOAT',
  'COMPILE', 'SYNTAX', 'DEBUG', 'SCRIPT', 'MODULE', 'LIBRARY', 'IMPORT',
  'EXPORT', 'DEPLOY', 'BUILD', 'BRANCH', 'COMMIT', 'MERGE', 'CLONE',
  'ATTACK', 'DEFEND', 'INJECT', 'PAYLOAD', 'EXPLOIT', 'PATCH', 'AUDIT',
  'MONITOR', 'DETECT', 'PREVENT', 'RECOVER', 'BACKUP', 'RESTORE', 'ARCHIVE',
  'ENCODE', 'DECODE', 'LOCK', 'UNLOCK', 'SALT', 'NONCE', 'PRIME', 'FACTOR',
  'MODULO', 'VERIFY', 'SHIELD', 'THREAT', 'RISK', 'POLICY', 'RULE', 'FLAG',
];

// ---- RANDOM UTILITIES ----
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomExcluding<T>(arr: T[], exclude: T[]): T {
  const filtered = arr.filter(x => !exclude.includes(x));
  if (filtered.length === 0) return arr[Math.floor(Math.random() * arr.length)];
  return pickRandom(filtered);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---- CHALLENGE GENERATOR ----
export function generateChallenge(
  order: number,
  usedWords: string[] = []
): Challenge {
  const difficulty = Math.min(5, Math.ceil(order / 3)) as 1 | 2 | 3 | 4 | 5;
  const word = pickRandomExcluding(WORD_POOL, usedWords);
  const points = LEVEL_POINTS[difficulty];
  const levelName = LEVEL_NAMES[difficulty];

  // Select formula based on difficulty
  const formulasByDifficulty: Record<number, FormulaType[]> = {
    1: ['shift_fixed', 'shift_fixed', 'shift_fixed'],
    2: ['shift_random', 'shift_alternating', 'reverse_alphabet', 'swap_pairs'],
    3: ['shift_increasing', 'shift_decreasing', 'a1z26_encode', 'binary_encode', 'hex_encode', 'base64_encode'],
    4: ['xor_binary', 'a1z26_decode', 'hex_decode', 'base64_decode', 'binary_decode'],
    5: ['multi_step'],
  };

  const formulaPool = formulasByDifficulty[difficulty];
  const formula = pickRandom(formulaPool);

  return buildChallenge(word, formula, difficulty, points, levelName, order);
}

function buildChallenge(
  word: string,
  formula: FormulaType,
  difficulty: 1 | 2 | 3 | 4 | 5,
  points: number,
  levelName: string,
  order: number
): Challenge {
  const id = `challenge_${order}_${Date.now()}`;
  let ciphertext = '';
  let formulaDescription = '';
  let key: string | number | undefined;
  let correctAnswer = word;
  let title = '';
  let type: ChallengeType = 'encryption';
  let explanation = '';
  let conceptName = '';
  let hints: [string, string, string] = ['', '', ''];

  switch (formula) {
    case 'shift_fixed': {
      const shift = difficulty === 1 ? pickRandom([1, 2, 3, -1, -3]) : randomInt(1, 9);
      key = shift;
      ciphertext = applyShift(word, shift);
      correctAnswer = word;
      formulaDescription = `SHIFT ${shift > 0 ? '+' : ''}${shift}`;
      title = 'Caesar Cipher';
      type = 'encryption';
      conceptName = 'Caesar Cipher';
      explanation = `Each letter was shifted ${Math.abs(shift)} position${Math.abs(shift) !== 1 ? 's' : ''} ${shift > 0 ? 'forward' : 'backward'} in the alphabet.`;
      hints = [
        'The alphabet has 26 letters. Letters wrap around.',
        `Try moving each letter ${Math.abs(shift)} position${Math.abs(shift) !== 1 ? 's' : ''} ${shift > 0 ? 'backward' : 'forward'}.`,
        `The key is ${shift > 0 ? '+' : ''}${shift}. To decrypt, use ${shift > 0 ? '-' : '+'}${Math.abs(shift)}.`,
      ];
      break;
    }
    case 'shift_random': {
      const shift = randomInt(1, 9) * (Math.random() > 0.5 ? 1 : -1);
      key = shift;
      ciphertext = applyShift(word, shift);
      correctAnswer = word;
      formulaDescription = `SHIFT ${shift > 0 ? '+' : ''}${shift} (random key)`;
      title = 'Random Shift Cipher';
      type = 'encryption';
      conceptName = 'Caesar Cipher (Random Key)';
      explanation = `A random key of ${shift > 0 ? '+' : ''}${shift} was used. Each letter was shifted by this amount.`;
      hints = [
        'This is a Caesar cipher with a random shift key.',
        'Try different shift amounts — the key is between 1 and 9.',
        `The shift key is ${shift > 0 ? '+' : ''}${shift}.`,
      ];
      break;
    }
    case 'shift_alternating': {
      const shift = randomInt(1, 4);
      key = shift;
      ciphertext = applyAlternatingShift(word, shift);
      correctAnswer = word;
      formulaDescription = `ALTERNATING ±${shift} (+${shift}, -${shift}, +${shift}, ...)`;
      title = 'Alternating Shift';
      type = 'pattern';
      conceptName = 'Alternating Shift Pattern';
      explanation = `Odd positions were shifted +${shift}, even positions -${shift} (1-indexed from left).`;
      hints = [
        'Not all letters use the same shift!',
        `The pattern alternates: +${shift}, -${shift}, +${shift}, -${shift}...`,
        `Odd-position letters: shift -${shift}. Even-position letters: shift +${shift}.`,
      ];
      break;
    }
    case 'shift_increasing': {
      ciphertext = applyIncreasingShift(word);
      correctAnswer = word;
      formulaDescription = 'INCREASING SHIFT (+1, +2, +3, +4, ...)';
      title = 'Increasing Shift';
      type = 'pattern';
      conceptName = 'Progressive Shift Pattern';
      explanation = `The 1st letter shifted +1, 2nd +2, 3rd +3, and so on.`;
      hints = [
        'Each letter uses a different shift amount!',
        'The shift increases by 1 for each letter: +1, +2, +3...',
        'Reverse each shift: 1st letter -1, 2nd -2, 3rd -3...',
      ];
      break;
    }
    case 'shift_decreasing': {
      ciphertext = applyDecreasingShift(word);
      correctAnswer = word;
      formulaDescription = 'DECREASING SHIFT (-1, -2, -3, -4, ...)';
      title = 'Decreasing Shift';
      type = 'pattern';
      conceptName = 'Progressive Shift Pattern';
      explanation = `The 1st letter shifted -1, 2nd -2, 3rd -3, and so on.`;
      hints = [
        'Each letter uses a different shift amount!',
        'The shift decreases by 1 for each letter: -1, -2, -3...',
        'Reverse each shift: 1st letter +1, 2nd +2, 3rd +3...',
      ];
      break;
    }
    case 'reverse_alphabet': {
      ciphertext = applyReverseAlphabet(word);
      correctAnswer = word;
      formulaDescription = 'REVERSE ALPHABET (A↔Z, B↔Y, C↔X...)';
      title = 'Reverse Alphabet (Atbash)';
      type = 'encryption';
      conceptName = 'Atbash Cipher';
      explanation = `Each letter is mapped to its mirror: A↔Z, B↔Y. Formula: position = 27 - original position.`;
      hints = [
        'The alphabet is reversed. A becomes Z, Z becomes A.',
        'Find the mirror of each letter: A↔Z, B↔Y, C↔X...',
        'Apply the same transformation again — the cipher is its own inverse!',
      ];
      break;
    }
    case 'swap_pairs': {
      ciphertext = applySwapPairs(word);
      correctAnswer = word;
      formulaDescription = 'SWAP ADJACENT PAIRS (AB → BA)';
      title = 'Pair Swap Cipher';
      type = 'encryption';
      conceptName = 'Rail Fence / Transposition Cipher';
      explanation = `Every two adjacent letters were swapped. SE→ES, CU→UC, RE→ER.`;
      hints = [
        'Look at the letters in pairs.',
        'Try swapping every two adjacent letters.',
        'Pairs: swap position 1↔2, 3↔4, 5↔6...',
      ];
      break;
    }
    case 'a1z26_encode': {
      ciphertext = applyA1Z26Encode(word);
      correctAnswer = word;
      formulaDescription = 'A1Z26 ENCODING (A=1, B=2, ... Z=26)';
      title = 'A1Z26 Number Code';
      type = 'encoding';
      conceptName = 'A1Z26 Substitution';
      explanation = `Each letter was replaced by its position in the alphabet: A=1, B=2, ..., Z=26.`;
      hints = [
        'Each number represents a letter\'s position in the alphabet.',
        'A=1, B=2, C=3... Z=26. Convert each number to a letter.',
        `The numbers are: ${ciphertext}. Match each to its letter.`,
      ];
      break;
    }
    case 'a1z26_decode': {
      // We give them numbers and they decode to the word
      const encoded = applyA1Z26Encode(word);
      ciphertext = encoded;
      correctAnswer = word;
      formulaDescription = 'DECODE A1Z26 (each number = a letter)';
      title = 'Decode Number Sequence';
      type = 'encoding';
      conceptName = 'A1Z26 Substitution';
      explanation = `Numbers represent letter positions: 1=A, 2=B, ..., 26=Z.`;
      hints = [
        'Each number between 1 and 26 represents a letter.',
        '1=A, 2=B, 3=C... 26=Z.',
        `Count through: ${encoded}.`,
      ];
      break;
    }
    case 'binary_encode': {
      ciphertext = applyBinaryEncode(word);
      correctAnswer = word;
      formulaDescription = 'BINARY → ASCII (8-bit encoding)';
      title = 'Binary to ASCII';
      type = 'encoding';
      conceptName = 'Binary (Base-2) Encoding';
      explanation = `Each letter was converted to its 8-bit ASCII binary representation.`;
      hints = [
        'Binary uses only 0s and 1s. Each 8-bit group = 1 character.',
        'Convert each 8-bit binary group to decimal, then to its ASCII letter.',
        `There are ${word.length} groups of 8 bits — one per letter.`,
      ];
      break;
    }
    case 'binary_decode': {
      const encoded = applyBinaryEncode(word);
      ciphertext = encoded;
      correctAnswer = word;
      formulaDescription = 'DECODE: BINARY → ASCII';
      title = 'Decode Binary Message';
      type = 'encoding';
      conceptName = 'Binary ASCII Decoding';
      explanation = `Each 8-bit binary sequence maps to an ASCII character.`;
      hints = [
        'Split by spaces. Each 8-bit group is one letter.',
        'Convert binary to decimal: 01000001 = 65 = A.',
        `The binary groups decode to the letters of the word.`,
      ];
      break;
    }
    case 'hex_encode': {
      ciphertext = applyHexEncode(word);
      correctAnswer = word;
      formulaDescription = 'HEX ENCODING (letters → hexadecimal ASCII)';
      title = 'ASCII to Hexadecimal';
      type = 'encoding';
      conceptName = 'Hexadecimal (Base-16) Encoding';
      explanation = `Each letter's ASCII code was written in base-16 (hexadecimal). Note: this is encoding, NOT encryption!`;
      hints = [
        'Hexadecimal uses digits 0-9 and letters A-F.',
        'Convert each hex pair to its decimal ASCII code, then to a letter.',
        `A=41, B=42... Z=5A in hexadecimal. Decode each pair.`,
      ];
      break;
    }
    case 'hex_decode': {
      const encoded = applyHexEncode(word);
      ciphertext = encoded;
      correctAnswer = word;
      formulaDescription = 'DECODE: HEX → ASCII';
      title = 'Decode Hexadecimal';
      type = 'encoding';
      conceptName = 'Hexadecimal Decoding';
      explanation = `Hex pairs were converted to ASCII characters.`;
      hints = [
        'Split by spaces. Each hex pair (like 43) is one letter.',
        'Convert hex to decimal: 41=65=A, 42=66=B.',
        `Remember A=41, B=42 ... Z=5A in hex.`,
      ];
      break;
    }
    case 'base64_encode': {
      ciphertext = applyBase64Encode(word);
      correctAnswer = word;
      formulaDescription = 'BASE64 ENCODING';
      title = 'Base64 Encoding';
      type = 'encoding';
      conceptName = 'Base64 Encoding';
      explanation = `The text was encoded using Base64 — a way to represent binary data as printable text. Note: Base64 is ENCODING, not encryption!`;
      hints = [
        'Base64 is a data encoding scheme, not encryption.',
        'Base64 uses A-Z, a-z, 0-9, +, / as its character set.',
        `Decode the Base64 string to get back the original text.`,
      ];
      break;
    }
    case 'base64_decode': {
      const encoded = applyBase64Encode(word);
      ciphertext = encoded;
      correctAnswer = word;
      formulaDescription = 'DECODE: BASE64 → TEXT';
      title = 'Decode Base64 Message';
      type = 'encoding';
      conceptName = 'Base64 Decoding';
      explanation = `Base64 encoding was reversed to reveal the plaintext. Base64 is encoding, not encryption.`;
      hints = [
        'Base64 strings often end with = or ==.',
        'Each Base64 character represents 6 bits of data.',
        'Remember: Base64 is encoding, not encryption. Anyone can decode it.',
      ];
      break;
    }
    case 'xor_binary': {
      const xor = generateXORChallenge();
      ciphertext = `${xor.a} XOR ${xor.b} = ?`;
      correctAnswer = xor.result;
      formulaDescription = 'XOR OPERATION (0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0)';
      title = 'Binary XOR';
      type = 'encryption';
      conceptName = 'XOR (Exclusive OR) Cipher';
      explanation = `XOR (exclusive or) is fundamental to many encryption algorithms. Same bits → 0, Different bits → 1.`;
      hints = [
        'XOR: same bits = 0, different bits = 1.',
        '0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0',
        `Compute each bit position separately.`,
      ];
      break;
    }
    case 'multi_step': {
      // 3-step challenge
      const step1Shift = randomInt(2, 5);
      const after1 = applyShift(word, step1Shift);
      const after2 = applyReverseAlphabet(after1);
      const after3 = applySwapPairs(after2);
      ciphertext = after3;
      correctAnswer = word;
      formulaDescription = `MULTI-STEP: Step 1 SHIFT +${step1Shift} → Step 2 REVERSE ALPHABET → Step 3 SWAP PAIRS`;
      title = '⚡ Final Mission — Multi-Step Decryption';
      type = 'multi_step';
      conceptName = 'Multi-Step Cipher';
      explanation = `Step 1: SHIFT +${step1Shift} → "${after1}". Step 2: REVERSE ALPHABET → "${after2}". Step 3: SWAP PAIRS → "${after3}". Decrypt by reversing all steps.`;
      hints = [
        'Work backwards! Undo the last step first, then the second, then the first.',
        `Step 3 was SWAP PAIRS — swap adjacent letters. Then Step 2: REVERSE ALPHABET. Then Step 1: SHIFT -${step1Shift}.`,
        `After undoing Step 3 (Swap Pairs): "${after2}". After undoing Step 2 (Reverse Alphabet): "${after1}". Then shift -${step1Shift}.`,
      ];
      break;
    }
    default: {
      const shift = 3;
      ciphertext = applyShift(word, shift);
      correctAnswer = word;
      formulaDescription = 'SHIFT +3';
      title = 'Caesar Cipher';
      type = 'encryption';
      conceptName = 'Caesar Cipher';
      explanation = 'Each letter was shifted 3 positions forward.';
      hints = [
        'The alphabet has 26 letters.',
        'Try moving each letter 3 positions backward.',
        'The shift is +3. Decrypt with -3.',
      ];
    }
  }

  return {
    id,
    title,
    type,
    difficulty,
    levelName,
    plaintext: word,
    ciphertext,
    formula,
    formulaDescription,
    key,
    points,
    hints,
    correctAnswer,
    order,
    explanation,
    conceptName,
  };
}

// ---- VALIDATION ----
export function validateAnswer(submission: string, correctAnswer: string): boolean {
  return submission.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
}

// ---- SCORE CALCULATION ----
export function calculatePoints(
  basePoints: number,
  hintsUsed: number,
  attempts: number
): number {
  let pts = basePoints;
  // Hint penalties
  if (hintsUsed >= 1) pts = Math.floor(pts * 0.8);
  if (hintsUsed >= 2) pts = Math.floor(pts * 0.75);
  if (hintsUsed >= 3) pts = Math.floor(pts * 0.667);
  // Attempt penalties (after 2nd attempt)
  if (attempts > 2) pts = Math.max(1, pts - Math.floor(basePoints * 0.1 * (attempts - 2)));
  return Math.max(1, pts);
}

// ---- STEP EXPLANATION BUILDER ----
export function buildStepExplanation(
  ciphertext: string,
  formula: FormulaType,
  correctAnswer: string,
  key?: string | number
): Array<{ encrypted: string; arrow: string; decrypted: string }> {
  const steps: Array<{ encrypted: string; arrow: string; decrypted: string }> = [];
  const word = ciphertext.toUpperCase();
  const original = correctAnswer.toUpperCase();

  if (formula === 'shift_fixed' || formula === 'shift_random') {
    const shift = Number(key) || 3;
    for (let i = 0; i < Math.min(word.length, 10); i++) {
      if (ALPHA.includes(word[i])) {
        steps.push({
          encrypted: word[i],
          arrow: `SHIFT ${shift > 0 ? '-' : '+'}${Math.abs(shift)}`,
          decrypted: original[i] || '',
        });
      }
    }
  }
  return steps;
}
