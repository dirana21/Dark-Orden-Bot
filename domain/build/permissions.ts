import type { GuildRole } from "@/domain/auth/model";

export function canManageBuildSkills(role: GuildRole): boolean {
  return (
    role === "superadmin" || role === "owner" || role === "officer"
  );
}
