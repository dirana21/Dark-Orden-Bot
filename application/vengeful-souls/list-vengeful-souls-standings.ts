import type { VengefulSoulsStanding } from "@/domain/vengeful-souls/model";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";
import type { EventSessionNumber } from "@/domain/events/model";

export class ListVengefulSoulsStandings {
  constructor(private readonly scores: VengefulSoulsRepository) {}

  async execute(
    guildId: string,
    currentUserId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<VengefulSoulsStanding[]> {
    return (await this.scores.listGuildScores(guildId, sessionNumber)).map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === currentUserId,
      }),
    );
  }
}
