import type { AuthUser, NewUser, StoredUser } from "@/domain/auth/model";
import type { UserRepository } from "@/domain/auth/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureAuthSchema } from "@/infrastructure/db/ensure-auth-schema";

interface UserRow {
  id: string;
  guild_id: string;
  guild_name: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: "owner" | "officer" | "member";
  created_at: number;
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    guildId: row.guild_id,
    guildName: row.guild_name,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

export class D1UserRepository implements UserRepository {
  async findByUsername(username: string): Promise<StoredUser | null> {
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
          users.password_hash,
          users.role,
          users.created_at
        FROM users
        INNER JOIN guilds ON guilds.id = users.guild_id
        WHERE users.username = ?
        LIMIT 1`,
      )
      .bind(username)
      .first<UserRow>();

    return row ? mapUser(row) : null;
  }

  async create(user: NewUser): Promise<AuthUser> {
    const db = getD1();
    await ensureAuthSchema(db);

    await db
      .prepare(
        `INSERT INTO users
          (id, guild_id, username, display_name, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        user.guildId,
        user.username,
        user.displayName,
        user.passwordHash,
        user.role,
        user.createdAt,
      )
      .run();

    return {
      id: user.id,
      guildId: user.guildId,
      guildName: "Dark Orden",
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
