import type { GuildRole } from "@/domain/auth/model";

export const guildRoleLabels: Record<GuildRole, string> = {
  superadmin: "Глава гильдии",
  owner: "Глава гильдии",
  officer: "Офицер",
  member: "Участник",
};
