import type { GuildRole } from "@/domain/auth/model";

export interface VengefulSoulsPlayerScore {
  userId: string;
  displayName: string;
  role: GuildRole;
  points: number;
  updatedAt: number | null;
}

export interface VengefulSoulsStanding extends VengefulSoulsPlayerScore {
  rank: number;
  isCurrentUser: boolean;
}
