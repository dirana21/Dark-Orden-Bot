import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  const runtimeEnv = env as unknown as { DB?: D1Database };
  if (!runtimeEnv.DB) {
    throw new Error("Cloudflare D1 binding DB is unavailable.");
  }

  return runtimeEnv.DB;
}

export function getSkillIconsBucket(): R2Bucket {
  const runtimeEnv = env as unknown as { SKILL_ICONS?: R2Bucket };
  if (!runtimeEnv.SKILL_ICONS) {
    throw new Error("Cloudflare R2 binding SKILL_ICONS is unavailable.");
  }

  return runtimeEnv.SKILL_ICONS;
}
