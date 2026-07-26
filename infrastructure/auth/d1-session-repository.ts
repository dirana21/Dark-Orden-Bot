import type { AuthUser, GuildRole } from "@/domain/auth/model";
import type { SessionRepository } from "@/domain/auth/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureAuthSchema } from "@/infrastructure/db/ensure-auth-schema";

interface SessionUserRow {
  id: string;
  guild_id: string;
  guild_name: string;
  username: string;
  display_name: string;
  real_name: string | null;
  role: GuildRole;
  guild_member_count: number;
  created_at: number;
}

export class D1SessionRepository implements SessionRepository {
  async create(
    userId: string,
    tokenHash: string,
    createdAt: number,
    expiresAt: number,
  ): Promise<void> {
    const db = getD1();
    await ensureAuthSchema(db);
    await db
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(tokenHash, userId, expiresAt, createdAt)
      .run();
  }

  async findUserByTokenHash(
    tokenHash: string,
    now: number,
  ): Promise<AuthUser | null> {
    const db = getD1();
    await ensureAuthSchema(db);

    const row = await db
      .prepare(
        `SELECT
          users.id,
          users.guild_id,
          guilds.name AS guild_name,
          users.username,
          users.display_name,
          users.real_name,
          users.role,
          (
            SELECT COUNT(*)
            FROM users AS visible_members
            WHERE visible_members.guild_id = users.guild_id
              AND visible_members.is_hidden = 0
          ) AS guild_member_count,
          users.created_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        INNER JOIN guilds ON guilds.id = users.guild_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > ?
        LIMIT 1`,
      )
      .bind(tokenHash, now)
      .first<SessionUserRow>();

    return row
      ? {
          id: row.id,
          guildId: row.guild_id,
          guildName: row.guild_name,
          username: row.username,
          displayName: row.display_name,
          realName: row.real_name,
          role: row.role,
          guildMemberCount: Number(row.guild_member_count),
          createdAt: row.created_at,
        }
      : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const db = getD1();
    await ensureAuthSchema(db);
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  async deleteExpired(now: number): Promise<void> {
    const db = getD1();
    await ensureAuthSchema(db);
    await db
      .prepare("DELETE FROM sessions WHERE expires_at <= ?")
      .bind(now)
      .run();
  }
}
