import type { BuildCharacterClass } from "./model";

export const PLAYER_BUILD_SLOT_LIMIT = 10;

export const playerBuildSetupTypes = [
  "mass-pvp",
  "pvp",
  "pve",
  "bosses",
] as const;

export type PlayerBuildSetupType =
  (typeof playerBuildSetupTypes)[number];

export const playerBuildSetupLabels: Record<
  PlayerBuildSetupType,
  string
> = {
  "mass-pvp": "Массовое PvP",
  pvp: "PvP",
  pve: "PvE",
  bosses: "Боссы",
};

export interface PlayerBuildSlot {
  skillId: string;
  sigilIds: Array<string | null>;
  comboEnabled: boolean | null;
}

export interface PlayerBuildLoadout {
  character: BuildCharacterClass;
  setupType: PlayerBuildSetupType;
  slots: PlayerBuildSlot[];
  updatedAt: number | null;
}

export interface CommunityBuildAuthor {
  id: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  mainCharacter: BuildCharacterClass | null;
  mirrorCharacter: BuildCharacterClass | null;
  loadouts: PlayerBuildLoadout[];
}
