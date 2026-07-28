"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Check,
  ListTodo,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { GuildRole } from "@/domain/auth/model";
import type {
  PlannerTask,
  PlannerTaskKind,
  PlannerTaskScope,
} from "@/domain/planner/model";
import { canManageGuildPlanner } from "@/domain/planner/permissions";
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
  canDeleteTask,
  onToggle,
  onDelete,
}: {
  tasks: PlannerTask[];
  emptyText: string;
  savingTaskIds: Set<string>;
  canDeleteTask: (task: PlannerTask) => boolean;
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
            className={[
              "planner-task",
              task.scope === "guild" ? "is-guild-task" : "",
              task.completed ? "is-complete" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
            {canDeleteTask(task) ? (
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
            ) : (
              <span
                className="planner-task__locked"
                aria-label="Общая задача заблокирована администратором"
                title="Общая задача гильдии"
              >
                <LockKeyhole size={14} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const plannerPeriods: Array<{
  kind: PlannerTaskKind;
  eyebrow: string;
  title: string;
  resetText: string;
  emptyText: string;
}> = [
  {
    kind: "daily",
    eyebrow: "Каждый день",
    title: "Ежедневные",
    resetText: "Галочки снимутся завтра",
    emptyText: "Нет ежедневных пунктов.",
  },
  {
    kind: "weekly",
    eyebrow: "Каждую неделю",
    title: "Еженедельные",
    resetText: "Галочки снимутся в понедельник",
    emptyText: "Нет еженедельных пунктов.",
  },
  {
    kind: "monthly",
    eyebrow: "Каждый месяц",
    title: "Ежемесячные",
    resetText: "Галочки снимутся первого числа",
    emptyText: "Нет ежемесячных пунктов.",
  },
];

function PlannerPeriodGrid({
  idPrefix,
  tasks,
  isLoading,
  savingTaskIds,
  canDeleteTask,
  onToggle,
  onDelete,
}: {
  idPrefix: string;
  tasks: PlannerTask[];
  isLoading: boolean;
  savingTaskIds: Set<string>;
  canDeleteTask: (task: PlannerTask) => boolean;
  onToggle: (task: PlannerTask) => void;
  onDelete: (task: PlannerTask) => void;
}) {
  return (
    <div className="planner-lists">
      {plannerPeriods.map((period) => {
        const periodTasks = tasks.filter(
          (task) => task.kind === period.kind,
        );
        const titleId = `${idPrefix}-${period.kind}-tasks-title`;

        return (
          <section aria-labelledby={titleId} key={period.kind}>
            <div className="planner-list-heading">
              <div>
                <small>{period.eyebrow}</small>
                <h4 id={titleId}>{period.title}</h4>
                <p>
                  <RefreshCw size={12} /> {period.resetText}
                </p>
              </div>
              <span>{periodTasks.length}</span>
            </div>
            {isLoading ? (
              <div className="planner-loading">Загружаем задачи…</div>
            ) : (
              <TaskList
                tasks={periodTasks}
                emptyText={period.emptyText}
                savingTaskIds={savingTaskIds}
                canDeleteTask={canDeleteTask}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

export function WeeklyPlanner({ userRole }: { userRole: GuildRole }) {
  const canManageGuildTasks = canManageGuildPlanner(userRole);
  const [periods, setPeriods] = useState<PlannerPeriods | null>(null);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [taskKind, setTaskKind] = useState<PlannerTaskKind>("daily");
  const [taskScope, setTaskScope] = useState<PlannerTaskScope>(
    canManageGuildTasks ? "guild" : "personal",
  );
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingTaskIds, setSavingTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    function syncPeriods() {
      const next = getCurrentPlannerPeriods();
      setPeriods((current) =>
        current?.daily === next.daily &&
        current.weekly === next.weekly &&
        current.monthly === next.monthly
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

  const guildTasks = useMemo(
    () => tasks.filter((task) => task.scope === "guild"),
    [tasks],
  );
  const personalTasks = useMemo(
    () => tasks.filter((task) => task.scope === "personal"),
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
      const task = await gateway.create({
        kind: taskKind,
        scope: taskScope,
        title,
      });
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
            <CalendarCheck2 size={15} /> Общие и личные пункты
          </span>
          <h2 id="planner-title">План гильдии и мои заметки</h2>
          <p>
            Общие пункты задаёт глава гильдии, а личные заметки видны только
            вашему аккаунту. Все отметки сбрасываются по своему периоду.
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
        {canManageGuildTasks ? (
          <div
            className="planner-scope-switch"
            aria-label="Кому добавить задачу"
          >
            <button
              className={taskScope === "guild" ? "is-active" : ""}
              type="button"
              aria-pressed={taskScope === "guild"}
              onClick={() => setTaskScope("guild")}
            >
              <ShieldCheck size={14} /> Для всей гильдии
            </button>
            <button
              className={taskScope === "personal" ? "is-active" : ""}
              type="button"
              aria-pressed={taskScope === "personal"}
              onClick={() => setTaskScope("personal")}
            >
              <ListTodo size={14} /> Только мне
            </button>
          </div>
        ) : (
          <div className="planner-personal-form-label">
            <ListTodo size={14} />
            Новая личная заметка — её видите только вы
          </div>
        )}
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
          <button
            className={taskKind === "monthly" ? "is-active" : ""}
            type="button"
            aria-pressed={taskKind === "monthly"}
            onClick={() => setTaskKind("monthly")}
          >
            Ежемесячная
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
                : taskKind === "weekly"
                  ? "Например: подготовиться к событию"
                  : "Например: закрыть месячную цель"
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

      <section
        className="planner-scope-section planner-scope-section--guild"
        aria-labelledby="guild-planner-title"
      >
        <div className="planner-scope-heading">
          <span className="planner-scope-heading__icon">
            <LockKeyhole size={17} />
          </span>
          <div>
            <small>Для всех участников</small>
            <h3 id="guild-planner-title">Общие задачи гильдии</h3>
            <p>
              Игроки отмечают выполнение отдельно. Изменять список может
              только глава гильдии.
            </p>
          </div>
          <strong>{guildTasks.length}</strong>
        </div>
        <PlannerPeriodGrid
          idPrefix="guild"
          tasks={guildTasks}
          isLoading={isLoading}
          savingTaskIds={savingTaskIds}
          canDeleteTask={() => canManageGuildTasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </section>

      <section
        className="planner-scope-section planner-scope-section--personal"
        aria-labelledby="personal-planner-title"
      >
        <div className="planner-scope-heading">
          <span className="planner-scope-heading__icon">
            <ListTodo size={17} />
          </span>
          <div>
            <small>Только для вашего аккаунта</small>
            <h3 id="personal-planner-title">Мои заметки</h3>
            <p>Эти пункты не видны другим участникам гильдии.</p>
          </div>
          <strong>{personalTasks.length}</strong>
        </div>
        <PlannerPeriodGrid
          idPrefix="personal"
          tasks={personalTasks}
          isLoading={isLoading}
          savingTaskIds={savingTaskIds}
          canDeleteTask={() => true}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </section>
    </section>
  );
}
