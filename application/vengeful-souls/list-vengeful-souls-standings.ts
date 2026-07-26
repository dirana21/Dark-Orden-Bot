import type { VengefulSoulsStanding } from "@/domain/vengeful-souls/model";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";

export class ListVengefulSoulsStandings {
  constructor(private readonly scores: VengefulSoulsRepository) {}

  async execute(
    guildId: string,
    currentUserId: string,
  ): Promise<VengefulSoulsStanding[]> {
    return (await this.scores.listGuildScores(guildId)).map(
      (entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === currentUserId,
      }),
    );
  }
}
