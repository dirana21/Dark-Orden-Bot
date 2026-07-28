import type { GuildRole } from "@/domain/auth/model";

export function canManageGuildPlanner(role: GuildRole): boolean {
  return role === "superadmin" || role === "owner";
}
