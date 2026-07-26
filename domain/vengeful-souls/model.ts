import type { EventRole } from "@/domain/events/model";

export interface VengefulSoulsPlayerScore {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  eventRole: EventRole | null;
  points: number;
  updatedAt: number | null;
}

export interface VengefulSoulsStanding extends VengefulSoulsPlayerScore {
  rank: number;
  isCurrentUser: boolean;
}
