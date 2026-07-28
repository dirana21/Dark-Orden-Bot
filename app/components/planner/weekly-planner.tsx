"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Check,
  ListTodo,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { PlannerTask, PlannerTaskKind } from "@/domain/planner/model";
import { HttpPlannerGateway } from "@/app/lib/planner-client";
import { announcePlannerTasks } from "@/app/lib/planner-events";
import {
  getCurrentPlannerPeriods,
  type PlannerPeriods,
} from "@/app/lib/planner-periods";

const gateway = new HttpPlannerGateway();

function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort(
    (left, right) =>
      Number(left.completed) - Number(right.completed) ||
      left.createdAt - right.createdAt,
  );
}

function TaskList({
  tasks,
  emptyText,
  savingTaskIds,
  onToggle,
  onDelete,
}: {
  tasks: PlannerTask[];
  emptyText: string;
  savingTaskIds: Set<string>;
  onToggle: (task: PlannerTask) => void;
  onDelete: (task: PlannerTask) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="planner-empty">
        <ListTodo size={23} />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="planner-task-list">
      {tasks.map((task) => {
        const isSaving = savingTaskIds.has(task.id);
        return (
          <li
            className={task.completed ? "planner-task is-complete" : "planner-task"}
            key={task.id}
          >
            <button
              className="planner-task__check"
              type="button"
              aria-label={
                task.completed
                  ? `Вернуть задачу «${task.title}» в работу`
                  : `Отметить задачу «${task.title}» выполненной`
              }
              aria-pressed={task.completed}
              disabled={isSaving}
              onClick={() => onToggle(task)}
            >
              {task.completed ? <Check size={15} strokeWidth={3} /> : null}
            </button>
            <span className="planner-task__title">{task.title}</span>
            <button
              className="planner-task__delete"
              type="button"
              aria-label={`Удалить задачу «${task.title}»`}
              title="Удалить задачу"
              disabled={isSaving}
              onClick={() => onDelete(task)}
            >
              <Trash2 size={15} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function WeeklyPlanner() {
  const [periods, setPeriods] = useState<PlannerPeriods | null>(null);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [taskKind, setTaskKind] = useState<PlannerTaskKind>("daily");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingTaskIds, setSavingTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    function syncPeriods() {
      const next = getCurrentPlannerPeriods();
      setPeriods((current) =>
        current?.daily === next.daily && current.weekly === next.weekly
          ? current
          : next,
      );
    }

    syncPeriods();
    const interval = window.setInterval(syncPeriods, 60_000);
    document.addEventListener("visibilitychange", syncPeriods);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", syncPeriods);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      announcePlannerTasks(tasks);
    }
  }, [isLoading, tasks]);

  useEffect(() => {
    if (!periods) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    gateway
      .list(periods, controller.signal)
      .then((nextTasks) => setTasks(sortTasks(nextTasks)))
      .catch((loadError: unknown) => {
        if (
          !(loadError instanceof DOMException && loadError.name === "AbortError")
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Не удалось загрузить задачи.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [periods]);

  const dailyTasks = useMemo(
    () => tasks.filter((task) => task.kind === "daily"),
    [tasks],
  );
  const weeklyTasks = useMemo(
    () => tasks.filter((task) => task.kind === "weekly"),
    [tasks],
  );
  const completedCount = tasks.filter((task) => task.completed).length;
  const progress =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const markSaving = useCallback((taskId: string, saving: boolean) => {
    setSavingTaskIds((current) => {
      const next = new Set(current);
      if (saving) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const handleToggle = useCallback(
    async (task: PlannerTask) => {
      if (!periods) {
        return;
      }

      const completed = !task.completed;
      setError("");
      markSaving(task.id, true);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed } : item,
        ),
      );

      try {
        const updated = await gateway.setCompleted(
          task.id,
          completed,
          periods,
        );
        setTasks((current) =>
          sortTasks(
            current.map((item) => (item.id === updated.id ? updated : item)),
          ),
        );
      } catch (saveError) {
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, completed: task.completed } : item,
          ),
        );
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Не удалось сохранить отметку.",
        );
      } finally {
        markSaving(task.id, false);
      }
    },
    [markSaving, periods],
  );

  const handleDelete = useCallback(
    async (task: PlannerTask) => {
      setError("");
      markSaving(task.id, true);
      try {
        await gateway.delete(task.id);
        setTasks((current) => current.filter((item) => item.id !== task.id));
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Не удалось удалить задачу.",
        );
      } finally {
        markSaving(task.id, false);
      }
    },
    [markSaving],
  );

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      const task = await gateway.create({ kind: taskKind, title });
      setTasks((current) => sortTasks([...current, task]));
      setTitle("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Не удалось добавить задачу.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="planner-card" id="planner" aria-labelledby="planner-title">
      <header className="planner-header">
        <div>
          <span className="section-kicker">
            <CalendarCheck2 size={15} /> Только для вашего аккаунта
          </span>
          <h2 id="planner-title">Повторяющиеся задачи</h2>
          <p>
            Добавьте задачу один раз — выполненные отметки сбросятся сами в
            начале нового дня или недели.
          </p>
        </div>
        <div className="planner-progress" aria-label={`Выполнено ${progress}%`}>
          <strong>{progress}%</strong>
          <span>
            {completedCount} из {tasks.length}
          </span>
          <i aria-hidden="true">
            <b style={{ width: `${progress}%` }} />
          </i>
        </div>
      </header>

      <form className="planner-add-form" onSubmit={handleCreate}>
        <div className="planner-kind-switch" aria-label="Тип новой задачи">
          <button
            className={taskKind === "daily" ? "is-active" : ""}
            type="button"
            aria-pressed={taskKind === "daily"}
            onClick={() => setTaskKind("daily")}
          >
            Ежедневная
          </button>
          <button
            className={taskKind === "weekly" ? "is-active" : ""}
            type="button"
            aria-pressed={taskKind === "weekly"}
            onClick={() => setTaskKind("weekly")}
          >
            Еженедельная
          </button>
        </div>
        <label>
          <span className="sr-only">Название новой задачи</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            placeholder={
              taskKind === "daily"
                ? "Например: забрать ежедневные награды"
                : "Например: подготовиться к событию"
            }
            disabled={isCreating}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button
          className="planner-add-button"
          type="submit"
          disabled={isCreating || !title.trim()}
        >
          <Plus size={17} />
          {isCreating ? "Добавляем…" : "Добавить"}
        </button>
      </form>

      {error ? (
        <div className="planner-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="planner-lists">
        <section aria-labelledby="daily-tasks-title">
          <div className="planner-list-heading">
            <div>
              <small>Каждый день</small>
              <h3 id="daily-tasks-title">Ежедневные задачи</h3>
              <p>
                <RefreshCw size={12} /> Галочки снимутся завтра
              </p>
            </div>
            <span>{dailyTasks.length}</span>
          </div>
          {isLoading ? (
            <div className="planner-loading">Загружаем ежедневные задачи…</div>
          ) : (
            <TaskList
              tasks={dailyTasks}
              emptyText="Добавьте первую ежедневную задачу."
              savingTaskIds={savingTaskIds}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </section>

        <section aria-labelledby="weekly-tasks-title">
          <div className="planner-list-heading">
            <div>
              <small>Каждую неделю</small>
              <h3 id="weekly-tasks-title">Еженедельные задачи</h3>
              <p>
                <RefreshCw size={12} /> Галочки снимутся в понедельник
              </p>
            </div>
            <span>{weeklyTasks.length}</span>
          </div>
          {isLoading ? (
            <div className="planner-loading">Загружаем еженедельные задачи…</div>
          ) : (
            <TaskList
              tasks={weeklyTasks}
              emptyText="Добавьте первую еженедельную задачу."
              savingTaskIds={savingTaskIds}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </section>
  );
}
