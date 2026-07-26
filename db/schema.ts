import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const guilds = sqliteTable("guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    realName: text("real_name"),
    passwordHash: text("password_hash").notNull(),
    role: text("role", {
      enum: ["superadmin", "owner", "officer", "member"],
    })
      .notNull()
      .default("member"),
    isHidden: integer("is_hidden", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    index("users_guild_id_idx").on(table.guildId),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const blackSunScores = sqliteTable(
  "black_sun_scores",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id),
    points: integer("points").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("black_sun_scores_guild_points_idx").on(
      table.guildId,
      table.points,
    ),
  ],
);
