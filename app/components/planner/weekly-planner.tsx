"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { PlannerTask, PlannerTaskKind } from "@/domain/planner/model";
import { HttpPlannerGateway } from "@/app/lib/planner-client";

const gateway = new HttpPlannerGateway();
const shortDayNames = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function addDays(value: string, days: number): string {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function getWeekStart(value: string): string {
  const date = fromIsoDate(value);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return toIsoDate(date);
}

function formatWeekRange(weekStart: string): string {
  const start = fromIsoDate(weekStart);
  const end = fromIsoDate(addDays(weekStart, 6));
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" as const }),
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(end);
  return `${startLabel} — ${endLabel}`;
}

function formatSelectedDay(value: string): string {
  if (!value) {
    return "Выбранный день";
  }

  const label = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromIsoDate(value));
  return label.slice(0, 1).toLocaleUpperCase("ru") + label.slice(1);
}

function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort(
    (left, right) =>
      Number(left.completed) - Number(right.completed) ||
      left.scheduledDate.localeCompare(right.scheduledDate) ||
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
  const [weekStart, setWeekStart] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [today, setToday] = useState("");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [taskKind, setTaskKind] = useState<PlannerTaskKind>("daily");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingTaskIds, setSavingTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    const currentDate = toIsoDate(new Date());
    setToday(currentDate);
    setWeekStart(getWeekStart(currentDate));
    setSelectedDate(currentDate);
  }, []);

  useEffect(() => {
    if (!weekStart) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    gateway
      .list(weekStart, controller.signal)
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
  }, [weekStart]);

  const days = useMemo(
    () =>
      weekStart
        ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
        : [],
    [weekStart],
  );
  const weeklyTasks = useMemo(
    () => tasks.filter((task) => task.kind === "weekly"),
    [tasks],
  );
  const selectedDailyTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.kind === "daily" && task.scheduledDate === selectedDate,
      ),
    [selectedDate, tasks],
  );
  const completedCount = tasks.filter((task) => task.completed).length;
  const progress =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const isCurrentWeek = Boolean(
    today && weekStart && getWeekStart(today) === weekStart,
  );

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
      const completed = !task.completed;
      setError("");
      markSaving(task.id, true);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed } : item,
        ),
      );

      try {
        const updated = await gateway.setCompleted(task.id, completed);
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
    [markSaving],
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
    if (!title.trim() || !weekStart || !selectedDate) {
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      const task = await gateway.create({
        kind: taskKind,
        title,
        scheduledDate: taskKind === "weekly" ? weekStart : selectedDate,
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

  function moveWeek(direction: number) {
    const nextWeek = addDays(weekStart, direction * 7);
    setWeekStart(nextWeek);
    setSelectedDate(nextWeek);
  }

  function returnToToday() {
    const currentDate = toIsoDate(new Date());
    setToday(currentDate);
    setWeekStart(getWeekStart(currentDate));
    setSelectedDate(currentDate);
  }

  return (
    <section className="planner-card" id="planner" aria-labelledby="planner-title">
      <header className="planner-header">
        <div>
          <span className="section-kicker">
            <CalendarCheck2 size={15} /> Только для вашего аккаунта
          </span>
          <h2 id="planner-title">Личный план</h2>
          <p>Соберите неделю по пунктам и отмечайте сделанное каждый день.</p>
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

      <div className="planner-week-toolbar">
        <button
          type="button"
          aria-label="Предыдущая неделя"
          onClick={() => moveWeek(-1)}
          disabled={!weekStart}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <small>Неделя</small>
          <strong>{weekStart ? formatWeekRange(weekStart) : "Загрузка…"}</strong>
        </div>
        <button
          type="button"
          aria-label="Следующая неделя"
          onClick={() => moveWeek(1)}
          disabled={!weekStart}
        >
          <ChevronRight size={18} />
        </button>
        {!isCurrentWeek ? (
          <button
            className="planner-today-button"
            type="button"
            onClick={returnToToday}
          >
            <RotateCcw size={14} /> Сегодня
          </button>
        ) : null}
      </div>

      <div className="planner-days" aria-label="Дни недели">
        {days.map((date, index) => {
          const dayTasks = tasks.filter(
            (task) => task.kind === "daily" && task.scheduledDate === date,
          );
          const done = dayTasks.filter((task) => task.completed).length;
          return (
            <button
              className={[
                date === selectedDate ? "is-selected" : "",
                date === today ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              key={date}
              aria-pressed={date === selectedDate}
              onClick={() => setSelectedDate(date)}
            >
              <span>{shortDayNames[index]}</span>
              <strong>{fromIsoDate(date).getDate()}</strong>
              <small>
                {dayTasks.length > 0 ? `${done}/${dayTasks.length}` : "—"}
              </small>
            </button>
          );
        })}
      </div>

      <form className="planner-add-form" onSubmit={handleCreate}>
        <div className="planner-kind-switch" aria-label="Тип новой задачи">
          <button
            className={taskKind === "daily" ? "is-active" : ""}
            type="button"
            aria-pressed={taskKind === "daily"}
            onClick={() => setTaskKind("daily")}
          >
            На день
          </button>
          <button
            className={taskKind === "weekly" ? "is-active" : ""}
            type="button"
            aria-pressed={taskKind === "weekly"}
            onClick={() => setTaskKind("weekly")}
          >
            На неделю
          </button>
        </div>
        <label>
          <span className="sr-only">Название новой задачи</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            placeholder={
              taskKind === "weekly"
                ? "Например: подготовиться к событию"
                : `Задача на ${formatSelectedDay(selectedDate).toLocaleLowerCase("ru")}`
            }
            disabled={isCreating || !selectedDate}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button
          className="planner-add-button"
          type="submit"
          disabled={isCreating || !title.trim() || !selectedDate}
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
        <section aria-labelledby="weekly-tasks-title">
          <div className="planner-list-heading">
            <div>
              <small>Главные цели</small>
              <h3 id="weekly-tasks-title">На всю неделю</h3>
            </div>
            <span>{weeklyTasks.length}</span>
          </div>
          {isLoading ? (
            <div className="planner-loading">Загружаем личный план…</div>
          ) : (
            <TaskList
              tasks={weeklyTasks}
              emptyText="Добавьте первую цель на эту неделю."
              savingTaskIds={savingTaskIds}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </section>

        <section aria-labelledby="daily-tasks-title">
          <div className="planner-list-heading">
            <div>
              <small>Выбранный день</small>
              <h3 id="daily-tasks-title">{formatSelectedDay(selectedDate)}</h3>
            </div>
            <span>{selectedDailyTasks.length}</span>
          </div>
          {isLoading ? (
            <div className="planner-loading">Загружаем задачи дня…</div>
          ) : (
            <TaskList
              tasks={selectedDailyTasks}
              emptyText="На этот день пока ничего не запланировано."
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
