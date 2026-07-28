import type { PlannerTask } from "@/domain/planner/model";

export const PLANNER_TASKS_CHANGED_EVENT =
  "dark-orden:planner-tasks-changed";

export interface PlannerTasksChangedDetail {
  tasks: PlannerTask[];
}

export function announcePlannerTasks(tasks: PlannerTask[]): void {
  window.dispatchEvent(
    new CustomEvent<PlannerTasksChangedDetail>(
      PLANNER_TASKS_CHANGED_EVENT,
      { detail: { tasks } },
    ),
  );
}
