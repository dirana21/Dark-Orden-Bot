import type { EventRole } from "@/domain/events/model";

export interface BlackSunPlayerScore {
  userId: string;
  displayName: string;
  eventRole: EventRole | null;
  points: number;
  updatedAt: number | null;
}

export interface BlackSunStanding extends BlackSunPlayerScore {
  rank: number;
  isCurrentUser: boolean;
}
