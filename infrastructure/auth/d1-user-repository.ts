import type {
  AuthUser,
  GuildRole,
  LinkDiscordProfileInput,
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
  discord_user_id: string | null;
  discord_username: string | null;
  discord_display_name: string | null;
  discord_avatar_hash: string | null;
  discord_connected_at: number | null;
  guild_member_count: number;
  created_at: number;
}

function mapPublicUser(row: UserRow): AuthUser {
  const discord =
    row.discord_user_id &&
    row.discord_username &&
    row.discord_display_name &&
    row.discord_connected_at
      ? {
          userId: row.discord_user_id,
          username: row.discord_username,
          displayName: row.discord_display_name,
          avatarUrl: row.discord_avatar_hash
            ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(row.discord_user_id)}/${encodeURIComponent(row.discord_avatar_hash)}.webp?size=128`
            : null,
          connectedAt: row.discord_connected_at,
        }
      : null;

  return {
    id: row.id,
    guildId: row.guild_id,
    guildName: row.guild_name,
    username: row.username,
    displayName: row.display_name,
    realName: row.real_name,
    role: row.role,
    discord,
    guildMemberCount: Number(row.guild_member_count),
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
  private async findPublicById(userId: string): Promise<AuthUser> {
    const db = getD1();
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
          users.discord_user_id,
          users.discord_username,
          users.discord_display_name,
          users.discord_avatar_hash,
          users.discord_connected_at,
          (
            SELECT COUNT(*)
            FROM users AS visible_members
            WHERE visible_members.guild_id = users.guild_id
              AND visible_members.is_hidden = 0
          ) AS guild_member_count,
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
          users.discord_user_id,
          users.discord_username,
          users.discord_display_name,
          users.discord_avatar_hash,
          users.discord_connected_at,
          (
            SELECT COUNT(*)
            FROM users AS visible_members
            WHERE visible_members.guild_id = users.guild_id
              AND visible_members.is_hidden = 0
          ) AS guild_member_count,
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

    const memberCount = await db
      .prepare(
        `SELECT COUNT(*) AS guild_member_count
         FROM users
         WHERE guild_id = ? AND is_hidden = 0`,
      )
      .bind(user.guildId)
      .first<{ guild_member_count: number }>();

    return {
      id: user.id,
      guildId: user.guildId,
      guildName: "Dark Orden",
      username: user.username,
      displayName: user.displayName,
      realName: user.realName,
      role: user.role,
      discord: null,
      guildMemberCount: Number(memberCount?.guild_member_count ?? 1),
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

    return this.findPublicById(userId);
  }

  async linkDiscord(
    userId: string,
    profile: LinkDiscordProfileInput,
  ): Promise<AuthUser> {
    const db = getD1();
    await ensureAuthSchema(db);

    try {
      await db
        .prepare(
          `UPDATE users
           SET display_name = ?,
               discord_user_id = ?,
               discord_username = ?,
               discord_display_name = ?,
               discord_avatar_hash = ?,
               discord_connected_at = ?
           WHERE id = ?`,
        )
        .bind(
          profile.displayName,
          profile.userId,
          profile.username,
          profile.displayName,
          profile.avatarHash,
          profile.connectedAt,
          userId,
        )
        .run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNIQUE") || message.includes("unique")) {
        throw new AuthError(
          "USER_EXISTS",
          "Этот аккаунт Discord уже привязан к другому участнику.",
        );
      }
      throw error;
    }

    return this.findPublicById(userId);
  }

  async disconnectDiscord(userId: string): Promise<AuthUser> {
    const db = getD1();
    await ensureAuthSchema(db);
    await db
      .prepare(
        `UPDATE users
         SET discord_user_id = NULL,
             discord_username = NULL,
             discord_display_name = NULL,
             discord_avatar_hash = NULL,
             discord_connected_at = NULL
         WHERE id = ?`,
      )
      .bind(userId)
      .run();

    return this.findPublicById(userId);
  }
}
