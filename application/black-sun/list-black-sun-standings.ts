import type { BlackSunStanding } from "@/domain/black-sun/model";
import type { BlackSunRepository } from "@/domain/black-sun/ports";

export class ListBlackSunStandings {
  constructor(private readonly scores: BlackSunRepository) {}

  async execute(
    guildId: string,
    currentUserId: string,
  ): Promise<BlackSunStanding[]> {
    return (await this.scores.listGuildScores(guildId)).map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === currentUserId,
      }),
    );
  }
}
