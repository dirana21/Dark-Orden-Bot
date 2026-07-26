export type GuildRole = "superadmin" | "owner" | "officer" | "member";

export interface AuthUser {
  id: string;
  guildId: string;
  guildName: string;
  username: string;
  displayName: string;
  realName: string | null;
  role: GuildRole;
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

export interface AuthResult {
  user: AuthUser;
  sessionToken: string;
  expiresAt: number;
}
