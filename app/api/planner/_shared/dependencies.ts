import { CreatePlannerTask } from "@/application/planner/create-planner-task";
import { DeletePlannerTask } from "@/application/planner/delete-planner-task";
import { ListPlannerTasks } from "@/application/planner/list-planner-tasks";
import { SetPlannerTaskCompleted } from "@/application/planner/set-planner-task-completed";
import { D1PlannerTaskRepository } from "@/infrastructure/planner/d1-planner-task-repository";
import {
  CryptoIdGenerator,
  SystemClock,
} from "@/infrastructure/system/system-services";

const tasks = new D1PlannerTaskRepository();
const ids = new CryptoIdGenerator();
const clock = new SystemClock();

export const plannerUseCases = {
  list: new ListPlannerTasks(tasks),
  create: new CreatePlannerTask(tasks, ids, clock),
  setCompleted: new SetPlannerTaskCompleted(tasks, clock),
  delete: new DeletePlannerTask(tasks),
};
