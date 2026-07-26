import type { SessionTokenService } from "@/domain/auth/ports";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export class WebCryptoSessionToken implements SessionTokenService {
  generate(): string {
    return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  }

  async hash(token: string): Promise<string> {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    return toBase64Url(new Uint8Array(hash));
  }
}
