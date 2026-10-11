import type { GeneratePasswordOptions } from "@securevault/shared-types";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
// Excludes visually-ambiguous/quote/backslash characters that cause copy-paste issues
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

export function generatePassword(options: GeneratePasswordOptions): string {
  let charset = "";
  if (options.useLowercase) charset += LOWERCASE;
  if (options.useUppercase) charset += UPPERCASE;
  if (options.useNumbers) charset += NUMBERS;
  if (options.useSymbols) charset += SYMBOLS;

  if (charset.length === 0) {
    throw new Error("At least one character set must be enabled");
  }

  // Rejection sampling avoids modulo bias from `randomValue % charset.length`.
  const maxValid = Math.floor(256 / charset.length) * charset.length;
  const randomBuffer = new Uint8Array(options.length * 2); // headroom for rejected samples
  crypto.getRandomValues(randomBuffer);

  let result = "";
  let bufferIndex = 0;
  while (result.length < options.length) {
    if (bufferIndex >= randomBuffer.length) {
      crypto.getRandomValues(randomBuffer);
      bufferIndex = 0;
    }
    const value = randomBuffer[bufferIndex++]!;
    if (value < maxValid) {
      result += charset[value % charset.length];
    }
  }

  return result;
}

export function estimatePasswordStrength(password: string): "weak" | "fair" | "strong" | "excellent" {
  let entropy = 0;
  if (/[a-z]/.test(password)) entropy += 26;
  if (/[A-Z]/.test(password)) entropy += 26;
  if (/[0-9]/.test(password)) entropy += 10;
  if (/[^a-zA-Z0-9]/.test(password)) entropy += SYMBOLS.length;

  const bits = password.length * Math.log2(Math.max(entropy, 1));
  if (bits < 40) return "weak";
  if (bits < 60) return "fair";
  if (bits < 80) return "strong";
  return "excellent";
}
