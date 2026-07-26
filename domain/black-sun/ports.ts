import type { BlackSunPlayerScore } from "./model";
import type { EventRole, EventSessionNumber } from "@/domain/events/model";

export interface BlackSunRepository {
  listGuildScores(
    guildId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<BlackSunPlayerScore[]>;
  savePlayerScore(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    points: number,
    updatedAt: number,
  ): Promise<boolean>;
  savePlayerRole(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    role: EventRole,
  ): Promise<boolean>;
}
