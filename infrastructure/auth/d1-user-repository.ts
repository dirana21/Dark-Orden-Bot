import type {
  AuthUser,
  GuildRole,
  NewUser,
  StoredUser,
} from "@/domain/auth/model";
import { AuthError } from "@/domain/auth/errors";
import type { UpdateProfileInput } from "@/domain/auth/model";
import type {
  ProfileRepository,
  UserRepository,
} from "@/domain/auth/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureAuthSchema } from "@/infrastructure/db/ensure-auth-schema";

interface UserRow {
  id: string;
  guild_id: string;
  guild_name: string;
  username: string;
  display_name: string;
  real_name: string | null;
  password_hash: string;
  role: GuildRole;
  created_at: number;
}

function mapPublicUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    guildId: row.guild_id,
    guildName: row.guild_name,
    username: row.username,
    displayName: row.display_name,
    realName: row.real_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapUser(row: UserRow): StoredUser {
  return {
    ...mapPublicUser(row),
    passwordHash: row.password_hash,
  };
}

export class D1UserRepository implements UserRepository, ProfileRepository {
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
          users.real_name,
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
          (id, guild_id, username, display_name, real_name, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        user.guildId,
        user.username,
        user.displayName,
        user.realName,
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
      realName: user.realName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    profile: UpdateProfileInput,
  ): Promise<AuthUser> {
    const db = getD1();
    await ensureAuthSchema(db);

    await db
      .prepare(
        `UPDATE users
         SET display_name = ?, real_name = ?
         WHERE id = ?`,
      )
      .bind(profile.displayName, profile.realName ?? null, userId)
      .run();

    const row = await db
      .prepare(
        `SELECT
          users.id,
          users.guild_id,
          guilds.name AS guild_name,
          users.username,
          users.display_name,
          users.real_name,
          users.password_hash,
          users.role,
          users.created_at
        FROM users
        INNER JOIN guilds ON guilds.id = users.guild_id
        WHERE users.id = ?
        LIMIT 1`,
      )
      .bind(userId)
      .first<UserRow>();

    if (!row) {
      throw new AuthError("UNAUTHORIZED", "Сессия больше не активна.");
    }

    return mapPublicUser(row);
  }
}
