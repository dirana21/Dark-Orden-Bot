import type { GuildRole } from "@/domain/auth/model";

export interface BlackSunPlayerScore {
  userId: string;
  displayName: string;
  role: GuildRole;
  points: number;
  updatedAt: number | null;
}

export interface BlackSunStanding extends BlackSunPlayerScore {
  rank: number;
  isCurrentUser: boolean;
}
