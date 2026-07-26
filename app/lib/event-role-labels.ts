import type { EventRole } from "@/domain/events/model";

export const eventRoleLabels: Record<EventRole, string> = {
  hunter: "Хантер",
  solo: "Соло",
  farmer: "Фармер",
  absent: "Отсутствую",
};

export const eventRoleDescriptions: Record<EventRole, string> = {
  hunter: "Охота в составе группы",
  solo: "Самостоятельное прохождение",
  farmer: "Фарм ресурсов события",
  absent: "Не участвую в этой сессии",
};
