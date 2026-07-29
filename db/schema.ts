import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
    discordUserId: text("discord_user_id"),
    discordUsername: text("discord_username"),
    discordDisplayName: text("discord_display_name"),
    discordAvatarHash: text("discord_avatar_hash"),
    discordConnectedAt: integer("discord_connected_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_discord_user_id_unique").on(table.discordUserId),
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
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id),
    sessionNumber: integer("session_number").notNull(),
    eventRole: text("event_role", {
      enum: ["hunter", "solo", "farmer", "absent"],
    }),
    points: integer("points").notNull().default(0),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.sessionNumber] }),
    index("black_sun_scores_guild_points_idx").on(
      table.guildId,
      table.sessionNumber,
      table.points,
    ),
  ],
);

export const vengefulSoulsScores = sqliteTable(
  "vengeful_souls_scores",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id),
    sessionNumber: integer("session_number").notNull(),
    eventRole: text("event_role", {
      enum: ["hunter", "solo", "farmer", "absent"],
    }),
    points: integer("points").notNull().default(0),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.sessionNumber] }),
    index("vengeful_souls_scores_guild_points_idx").on(
      table.guildId,
      table.sessionNumber,
      table.points,
    ),
  ],
);

export const plannerTasks = sqliteTable(
  "planner_tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["monthly", "weekly", "daily"] }).notNull(),
    title: text("title").notNull(),
    scheduledDate: text("scheduled_date").notNull(),
    completionPeriod: text("completion_period"),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("planner_tasks_user_schedule_idx").on(
      table.userId,
      table.scheduledDate,
      table.kind,
    ),
  ],
);

export const guildPlannerTasks = sqliteTable(
  "guild_planner_tasks",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["monthly", "weekly", "daily"] }).notNull(),
    title: text("title").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("guild_planner_tasks_guild_kind_idx").on(
      table.guildId,
      table.kind,
      table.createdAt,
    ),
  ],
);

export const guildPlannerTaskCompletions = sqliteTable(
  "guild_planner_task_completions",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => guildPlannerTasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completionPeriod: text("completion_period").notNull(),
    completedAt: integer("completed_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    index("guild_planner_task_completions_user_idx").on(
      table.userId,
      table.completionPeriod,
    ),
  ],
);

export const userBuildProfiles = sqliteTable("user_build_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  mainCharacter: text("main_character"),
  mirrorCharacter: text("mirror_character"),
  updatedAt: integer("updated_at").notNull(),
});

export const userBuildLoadouts = sqliteTable(
  "user_build_loadouts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    character: text("character").notNull(),
    slotsJson: text("slots_json").notNull().default("[]"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.character] }),
    index("user_build_loadouts_user_idx").on(table.userId),
  ],
);

export const buildCharacters = sqliteTable(
  "build_characters",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    imageKey: text("image_key"),
    imageContentType: text("image_content_type"),
    createdByUserId: text("created_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("build_characters_guild_name_idx").on(
      table.guildId,
      table.name,
    ),
    index("build_characters_guild_created_idx").on(
      table.guildId,
      table.createdAt,
    ),
  ],
);

export const buildSkills = sqliteTable(
  "build_skills",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    character: text("character").notNull(),
    slotType: text("slot_type").notNull().default("normal"),
    slotIndex: integer("slot_index").notNull().default(0),
    socketTypes: text("socket_types").notNull().default("[]"),
    name: text("name").notNull(),
    descriptionHtml: text("description_html").notNull(),
    iconKey: text("icon_key").notNull(),
    iconContentType: text("icon_content_type").notNull(),
    comboAvailable: integer("combo_available", { mode: "boolean" })
      .notNull()
      .default(false),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("build_skills_guild_character_idx").on(
      table.guildId,
      table.character,
      table.createdAt,
    ),
    uniqueIndex("build_skills_guild_character_slot_idx").on(
      table.guildId,
      table.character,
      table.slotType,
      table.slotIndex,
    ),
  ],
);

export const buildSigils = sqliteTable(
  "build_sigils",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description").notNull(),
    iconKey: text("icon_key").notNull(),
    iconContentType: text("icon_content_type").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("build_sigils_guild_category_idx").on(
      table.guildId,
      table.category,
      table.createdAt,
    ),
  ],
);

export const userBuildSkillSettings = sqliteTable(
  "user_build_skill_settings",
  {
    skillId: text("skill_id")
      .notNull()
      .references(() => buildSkills.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    comboEnabled: integer("combo_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.skillId, table.userId] }),
    index("user_build_skill_settings_user_idx").on(table.userId),
  ],
);
