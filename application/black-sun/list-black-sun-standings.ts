import type { BlackSunStanding } from "@/domain/black-sun/model";
import type { BlackSunRepository } from "@/domain/black-sun/ports";
import type { EventSessionNumber } from "@/domain/events/model";

export class ListBlackSunStandings {
  constructor(private readonly scores: BlackSunRepository) {}

  async execute(
    guildId: string,
    currentUserId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<BlackSunStanding[]> {
    return (await this.scores.listGuildScores(guildId, sessionNumber)).map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === currentUserId,
      }),
    );
  }
}
