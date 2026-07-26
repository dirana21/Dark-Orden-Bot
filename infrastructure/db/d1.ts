import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  const runtimeEnv = env as unknown as { DB?: D1Database };
  if (!runtimeEnv.DB) {
    throw new Error("Cloudflare D1 binding DB is unavailable.");
  }

  return runtimeEnv.DB;
}
