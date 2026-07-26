import type { VengefulSoulsPlayerScore } from "./model";

export interface VengefulSoulsRepository {
  listGuildScores(guildId: string): Promise<VengefulSoulsPlayerScore[]>;
  savePlayerScore(
    userId: string,
    guildId: string,
    points: number,
    updatedAt: number,
  ): Promise<boolean>;
}
