// =============================================================================
// SkyRideTour — Password Hashing Utilities
// Cybersecurity-grade bcrypt helpers with timing-safe comparison
// =============================================================================

import bcrypt from "bcryptjs";

/** Bcrypt cost factor — 12 provides ~300ms hash time (OWASP recommended minimum) */
const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * Always await this — it's intentionally CPU-intensive.
 *
 * @param password  Plain-text password from the registration form
 * @returns         Bcrypt hash string safe to store in the database
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Timing-safe password comparison.
 * Uses bcrypt.compare which is resistant to timing attacks —
 * it always takes the same time whether the password matches or not.
 *
 * @param plain   User-submitted plain-text password
 * @param hashed  Stored bcrypt hash from the database
 * @returns       true if passwords match
 */
export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  // Guard: if either value is empty, fail fast without revealing timing info
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
}

/**
 * Generate a bcrypt salt string — useful for manual salt inspection in tests.
 * Prefer hashPassword() for all production usage.
 */
export async function generateSalt(): Promise<string> {
  return bcrypt.genSalt(SALT_ROUNDS);
}

/**
 * Validate password strength (client-side pre-check).
 * Returns an error message string, or null if valid.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password)              return "Password is required";
  if (password.length < 8)   return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}
