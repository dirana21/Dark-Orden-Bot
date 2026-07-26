import { env } from "cloudflare:workers";
import type { RegistrationIdentifierVerifier } from "@/domain/auth/ports";

const encoder = new TextEncoder();

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
}

export class RuntimeRegistrationIdentifier
  implements RegistrationIdentifierVerifier
{
  async matches(candidate: string): Promise<boolean> {
    const runtimeEnv = env as unknown as {
      REGISTRATION_IDENTIFIER?: string;
    };
    const expected = runtimeEnv.REGISTRATION_IDENTIFIER;

    if (!expected) {
      return false;
    }

    const [candidateDigest, expectedDigest] = await Promise.all([
      digest(candidate),
      digest(expected),
    ]);

    let difference = 0;
    for (let index = 0; index < expectedDigest.length; index += 1) {
      difference |= candidateDigest[index] ^ expectedDigest[index];
    }

    return difference === 0;
  }
}
