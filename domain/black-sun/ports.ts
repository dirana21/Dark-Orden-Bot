import type { BlackSunPlayerScore } from "./model";

export interface BlackSunRepository {
  listGuildScores(guildId: string): Promise<BlackSunPlayerScore[]>;
  savePlayerScore(
    userId: string,
    guildId: string,
    points: number,
    updatedAt: number,
  ): Promise<boolean>;
}
