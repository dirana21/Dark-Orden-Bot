import type { PasswordHasher } from "@/domain/auth/ports";

const ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: Uint8Array.from(salt).buffer,
      iterations,
    },
    key,
    KEY_LENGTH,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export class WebCryptoPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    return `pbkdf2-sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, iterationsValue, saltValue, expectedValue] =
      encodedHash.split("$");
    const iterations = Number(iterationsValue);

    if (
      algorithm !== "pbkdf2-sha256" ||
      !Number.isInteger(iterations) ||
      iterations < 100_000 ||
      !saltValue ||
      !expectedValue
    ) {
      return false;
    }

    try {
      const actual = await derive(password, base64ToBytes(saltValue), iterations);
      return constantTimeEqual(actual, base64ToBytes(expectedValue));
    } catch {
      return false;
    }
  }
}
