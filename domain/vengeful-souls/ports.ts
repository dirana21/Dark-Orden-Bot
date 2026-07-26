import type { VengefulSoulsPlayerScore } from "./model";
import type { EventRole, EventSessionNumber } from "@/domain/events/model";

export interface VengefulSoulsRepository {
  listGuildScores(
    guildId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<VengefulSoulsPlayerScore[]>;
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
