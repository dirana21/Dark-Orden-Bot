export type GuildRole = "superadmin" | "owner" | "officer" | "member";

export interface DiscordProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt: number;
}

export interface AuthUser {
  id: string;
  guildId: string;
  guildName: string;
  username: string;
  displayName: string;
  realName: string | null;
  role: GuildRole;
  discord: DiscordProfile | null;
  guildMemberCount: number;
  createdAt: number;
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface NewUser {
  id: string;
  guildId: string;
  username: string;
  displayName: string;
  realName: string | null;
  passwordHash: string;
  role: GuildRole;
  createdAt: number;
}

export interface RegisterUserInput {
  username: string;
  displayName: string;
  password: string;
  guildIdentifier: string;
}

export interface LoginUserInput {
  username: string;
  password: string;
}

export interface UpdateProfileInput {
  displayName: string;
  realName?: string | null;
}

export interface LinkDiscordProfileInput {
  userId: string;
  username: string;
  displayName: string;
  avatarHash: string | null;
  connectedAt: number;
}

export interface AuthResult {
  user: AuthUser;
  sessionToken: string;
  expiresAt: number;
}
