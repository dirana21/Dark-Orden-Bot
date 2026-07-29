import type { BuildCharacterClass } from "./model";

export const PLAYER_BUILD_SLOT_LIMIT = 10;

export interface PlayerBuildSlot {
  skillId: string;
  sigilIds: Array<string | null>;
}

export interface PlayerBuildLoadout {
  character: BuildCharacterClass;
  slots: PlayerBuildSlot[];
  updatedAt: number | null;
}
