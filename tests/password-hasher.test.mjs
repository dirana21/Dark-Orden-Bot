import assert from "node:assert/strict";
import test from "node:test";
import { WebCryptoPasswordHasher } from "../infrastructure/auth/web-crypto-password-hasher.ts";

test("hashes and verifies passwords within the production iteration limit", async () => {
  const hasher = new WebCryptoPasswordHasher();
  const encoded = await hasher.hash("DarkOrden2026");

  assert.match(encoded, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await hasher.verify("DarkOrden2026", encoded), true);
  assert.equal(await hasher.verify("WrongPassword2026", encoded), false);
});
