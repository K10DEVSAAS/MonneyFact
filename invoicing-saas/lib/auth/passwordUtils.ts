/**
 * Utility functions for secure password hashing and rate limiting (brute-force protection)
 * Uses Web Crypto API (PBKDF2 with SHA-256 and 100,000 iterations)
 */

export interface HashResult {
  hash: string;
  salt: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingSeconds?: number;
  attemptsLeft?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a plain-text password securely with PBKDF2-SHA256
 */
export async function hashPassword(password: string, existingSaltHex?: string): Promise<HashResult> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  let saltBytes: Uint8Array;
  if (existingSaltHex) {
    saltBytes = hexToBuffer(existingSaltHex);
  } else {
    saltBytes = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(saltBytes);
    } else {
      const cryptoModule = require('crypto');
      const randomBuf = cryptoModule.randomBytes(16);
      saltBytes.set(randomBuf);
    }
  }

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : require('crypto').webcrypto;

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hash: bufferToHex(derivedKey),
    salt: bufferToHex(saltBytes.buffer as ArrayBuffer),
  };
}

/**
 * Verifies a plain-text password against a stored hash and salt
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    if (!password || !storedHash || !storedSalt) return false;
    const computed = await hashPassword(password, storedSalt);
    return computed.hash === storedHash;
  } catch (e) {
    console.error('Erreur de vérification du mot de passe:', e);
    return false;
  }
}

/**
 * Rate Limiting to prevent Brute-Force Attacks
 */
export function checkRateLimit(email: string): RateLimitResult {
  if (typeof window === 'undefined') return { allowed: true };
  const cleanEmail = email.toLowerCase().trim();
  const storageKey = `monneyfact_rate_limit_${cleanEmail}`;

  try {
    const dataStr = localStorage.getItem(storageKey);
    if (!dataStr) {
      return { allowed: true, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const data = JSON.parse(dataStr);
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingSeconds,
        attemptsLeft: 0,
      };
    }

    // Lockout expired, reset rate limit
    if (data.lockedUntil && now >= data.lockedUntil) {
      localStorage.removeItem(storageKey);
      return { allowed: true, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }

    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - (data.failedCount || 0));
    return { allowed: true, attemptsLeft };
  } catch (e) {
    return { allowed: true };
  }
}

export function recordFailedAttempt(email: string): RateLimitResult {
  if (typeof window === 'undefined') return { allowed: true };
  const cleanEmail = email.toLowerCase().trim();
  const storageKey = `monneyfact_rate_limit_${cleanEmail}`;

  try {
    const dataStr = localStorage.getItem(storageKey);
    let failedCount = 1;
    let lockedUntil: number | null = null;
    const now = Date.now();

    if (dataStr) {
      const data = JSON.parse(dataStr);
      failedCount = (data.failedCount || 0) + 1;
    }

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    const record = { failedCount, lockedUntil, lastAttempt: now };
    localStorage.setItem(storageKey, JSON.stringify(record));

    if (lockedUntil) {
      return {
        allowed: false,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsLeft: 0,
      };
    }

    return {
      allowed: true,
      attemptsLeft: MAX_FAILED_ATTEMPTS - failedCount,
    };
  } catch (e) {
    return { allowed: true };
  }
}

export function clearRateLimit(email: string): void {
  if (typeof window === 'undefined') return;
  const cleanEmail = email.toLowerCase().trim();
  localStorage.removeItem(`monneyfact_rate_limit_${cleanEmail}`);
}
