import { env } from "cloudflare:workers";
import { WebCryptoPasswordHasher } from "@/infrastructure/auth/web-crypto-password-hasher";

let initialization: Promise<void> | null = null;

interface AdminSeed {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: "superadmin" | "owner";
  isHidden: boolean;
}

async function getAdminSeeds(): Promise<AdminSeed[]> {
  const runtimeEnv = env as unknown as {
    BOOTSTRAP_SKYWALKER_PASSWORD_HASH?: string;
    BOOTSTRAP_DRIGAN21_PASSWORD_HASH?: string;
    BOOTSTRAP_SAKURKA_PASSWORD_HASH?: string;
    BOOTSTRAP_DEVILFLAME_PASSWORD_HASH?: string;
    BOOTSTRAP_SKYWALKER_PASSWORD?: string;
    BOOTSTRAP_DRIGAN21_PASSWORD?: string;
    BOOTSTRAP_SAKURKA_PASSWORD?: string;
    BOOTSTRAP_DEVILFLAME_PASSWORD?: string;
  };
  const passwords = new WebCryptoPasswordHasher();

  const accounts = [
    {
      id: "admin-skywalker",
      username: "skywalker",
      displayName: "SkyWalker",
      password: runtimeEnv.BOOTSTRAP_SKYWALKER_PASSWORD ?? "",
      existingHash: runtimeEnv.BOOTSTRAP_SKYWALKER_PASSWORD_HASH ?? "",
      role: "owner",
      isHidden: false,
    },
    {
      id: "admin-drigan21",
      username: "drigan21",
      displayName: "Drigan21",
      password: runtimeEnv.BOOTSTRAP_DRIGAN21_PASSWORD ?? "",
      existingHash: runtimeEnv.BOOTSTRAP_DRIGAN21_PASSWORD_HASH ?? "",
      role: "superadmin",
      isHidden: true,
    },
    {
      id: "admin-sakurka",
      username: "sakurka",
      displayName: "Sakurka",
      password: runtimeEnv.BOOTSTRAP_SAKURKA_PASSWORD ?? "",
      existingHash: runtimeEnv.BOOTSTRAP_SAKURKA_PASSWORD_HASH ?? "",
      role: "owner",
      isHidden: false,
    },
    {
      id: "admin-devilflame",
      username: "devilflame",
      displayName: "DevilFlame",
      password: runtimeEnv.BOOTSTRAP_DEVILFLAME_PASSWORD ?? "",
      existingHash:
        runtimeEnv.BOOTSTRAP_DEVILFLAME_PASSWORD_HASH ?? "",
      role: "superadmin",
      isHidden: true,
    },
  ] as const;

  const seeds = await Promise.all(
    accounts.map(async (account): Promise<AdminSeed> => ({
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      passwordHash: account.password
        ? await passwords.hash(account.password)
        : account.existingHash,
      role: account.role,
      isHidden: account.isHidden,
    })),
  );

  return seeds.filter((account) =>
    account.passwordHash.startsWith("pbkdf2-sha256$"),
  );
}

const statements = [
  `CREATE TABLE IF NOT EXISTS guilds (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    guild_id TEXT NOT NULL REFERENCES guilds(id),
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    real_name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    is_hidden INTEGER NOT NULL DEFAULT 0,
    discord_user_id TEXT,
    discord_username TEXT,
    discord_display_name TEXT,
    discord_avatar_hash TEXT,
    discord_connected_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS users_guild_id_idx ON users(guild_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS users_discord_user_id_unique ON users(discord_user_id)",
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)",
];

export async function ensureAuthSchema(db: D1Database): Promise<void> {
  if (!initialization) {
    initialization = db
      .batch(statements.map((statement) => db.prepare(statement)))
      .then(async () => {
        const columns = await db
          .prepare("PRAGMA table_info(users)")
          .all<{ name: string }>();

        if (!columns.results.some((column) => column.name === "real_name")) {
          await db
            .prepare("ALTER TABLE users ADD COLUMN real_name TEXT")
            .run();
        }

        if (!columns.results.some((column) => column.name === "is_hidden")) {
          await db
            .prepare(
              "ALTER TABLE users ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0",
            )
            .run();
        }

        const discordColumns = [
          ["discord_user_id", "TEXT"],
          ["discord_username", "TEXT"],
          ["discord_display_name", "TEXT"],
          ["discord_avatar_hash", "TEXT"],
          ["discord_connected_at", "INTEGER"],
        ] as const;

        for (const [name, type] of discordColumns) {
          if (!columns.results.some((column) => column.name === name)) {
            await db
              .prepare(`ALTER TABLE users ADD COLUMN ${name} ${type}`)
              .run();
          }
        }

        await db
          .prepare(
            "CREATE UNIQUE INDEX IF NOT EXISTS users_discord_user_id_unique ON users(discord_user_id)",
          )
          .run();

        await db
          .prepare(
            `INSERT OR IGNORE INTO guilds (id, name, slug, created_at)
             VALUES ('dark-orden', 'Dark Orden', 'dark-orden', 0)`,
          )
          .run();

        const adminSeeds = await getAdminSeeds();
        if (adminSeeds.length > 0) {
          await db.batch(
            adminSeeds.map((account) =>
              db
                .prepare(
                  `INSERT INTO users
                    (id, guild_id, username, display_name, real_name, password_hash, role, is_hidden, created_at)
                   VALUES (?, 'dark-orden', ?, ?, NULL, ?, ?, ?, ?)
                   ON CONFLICT(username) DO UPDATE SET
                     guild_id = excluded.guild_id,
                     display_name = excluded.display_name,
                     password_hash = excluded.password_hash,
                     role = excluded.role,
                     is_hidden = excluded.is_hidden`,
                )
                .bind(
                  account.id,
                  account.username,
                  account.displayName,
                  account.passwordHash,
                  account.role,
                  account.isHidden ? 1 : 0,
                  Date.now(),
                ),
            ),
          );
        }
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
