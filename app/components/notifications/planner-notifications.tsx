"use client";

import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PlannerTask } from "@/domain/planner/model";
import { HttpPlannerGateway } from "@/app/lib/planner-client";
import {
  PLANNER_TASKS_CHANGED_EVENT,
  type PlannerTasksChangedDetail,
} from "@/app/lib/planner-events";
import { getCurrentPlannerPeriods } from "@/app/lib/planner-periods";

const gateway = new HttpPlannerGateway();

function taskCountLabel(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  if (remainder100 >= 11 && remainder100 <= 14) {
    return `${count} задач`;
  }
  if (remainder10 === 1) {
    return `${count} задача`;
  }
  if (remainder10 >= 2 && remainder10 <= 4) {
    return `${count} задачи`;
  }
  return `${count} задач`;
}

export function PlannerNotifications() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const nextTasks = await gateway.list(
        getCurrentPlannerPeriods(),
        signal,
      );
      setTasks(nextTasks);
      setError("");
    } catch (loadError) {
      if (
        !(loadError instanceof DOMException && loadError.name === "AbortError")
      ) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить задачи.",
        );
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    function handlePlannerTasks(event: Event) {
      const detail = (event as CustomEvent<PlannerTasksChangedDetail>).detail;
      if (!detail?.tasks) {
        return;
      }
      setTasks(detail.tasks);
      setError("");
      setIsLoading(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadTasks();
      }
    }

    window.addEventListener(
      PLANNER_TASKS_CHANGED_EVENT,
      handlePlannerTasks,
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void loadTasks(controller.signal);

    return () => {
      controller.abort();
      window.removeEventListener(
        PLANNER_TASKS_CHANGED_EVENT,
        handlePlannerTasks,
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadTasks]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePress(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const dailyTasks = useMemo(
    () =>
      tasks.filter((task) => task.kind === "daily" && !task.completed),
    [tasks],
  );
  const weeklyTasks = useMemo(
    () =>
      tasks.filter((task) => task.kind === "weekly" && !task.completed),
    [tasks],
  );
  const total = dailyTasks.length + weeklyTasks.length;

  function openPlanner() {
    setIsOpen(false);
    document
      .getElementById("planner")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        className={[
          "icon-button",
          "notification-button",
          total > 0 ? "has-notifications" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        aria-label={
          total > 0
            ? `Незакрытые задачи: ${taskCountLabel(total)}`
            : "Незакрытых задач нет"
        }
        aria-expanded={isOpen}
        aria-controls="planner-notification-panel"
        title="Задачи"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) {
            void loadTasks();
          }
        }}
      >
        <Bell size={18} />
        {total > 0 ? (
          <span className="notification-counters" aria-hidden="true">
            {dailyTasks.length > 0 ? (
              <span className="notification-counter notification-counter--daily">
                {dailyTasks.length > 9 ? "9+" : dailyTasks.length}
              </span>
            ) : null}
            {weeklyTasks.length > 0 ? (
              <span className="notification-counter notification-counter--weekly">
                {weeklyTasks.length > 9 ? "9+" : weeklyTasks.length}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          className="notification-panel"
          id="planner-notification-panel"
          aria-label="Незакрытые задачи"
        >
          <header className="notification-panel__header">
            <div>
              <span>Личный контроль</span>
              <h2>Незакрытые задачи</h2>
            </div>
            <strong>{total}</strong>
          </header>

          <div className="notification-summary">
            <div className="notification-summary__item is-daily">
              <span>{dailyTasks.length}</span>
              <div>
                <strong>Ежедневные</strong>
                <small>Сбросятся завтра</small>
              </div>
            </div>
            <div className="notification-summary__item is-weekly">
              <span>{weeklyTasks.length}</span>
              <div>
                <strong>Еженедельные</strong>
                <small>Сбросятся в понедельник</small>
              </div>
            </div>
          </div>

          <div className="notification-panel__body">
            {isLoading ? (
              <div className="notification-state">
                <span className="notification-state__spinner" />
                Проверяем задачи…
              </div>
            ) : error ? (
              <div className="notification-state is-error">
                <CircleAlert size={20} />
                <p>{error}</p>
                <button type="button" onClick={() => void loadTasks()}>
                  Повторить
                </button>
              </div>
            ) : total === 0 ? (
              <div className="notification-state is-complete">
                <CheckCircle2 size={26} />
                <strong>Всё выполнено</strong>
                <p>На текущий день и неделю незакрытых задач нет.</p>
              </div>
            ) : (
              <div className="notification-task-groups">
                {dailyTasks.length > 0 ? (
                  <section aria-labelledby="notification-daily-title">
                    <h3 id="notification-daily-title">
                      <i className="is-daily" /> Ежедневные
                    </h3>
                    <ul>
                      {dailyTasks.map((task) => (
                        <li key={task.id}>
                          <button type="button" onClick={openPlanner}>
                            <i className="is-daily" />
                            <span>{task.title}</span>
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {weeklyTasks.length > 0 ? (
                  <section aria-labelledby="notification-weekly-title">
                    <h3 id="notification-weekly-title">
                      <i className="is-weekly" /> Еженедельные
                    </h3>
                    <ul>
                      {weeklyTasks.map((task) => (
                        <li key={task.id}>
                          <button type="button" onClick={openPlanner}>
                            <i className="is-weekly" />
                            <span>{task.title}</span>
                            <ChevronRight size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            )}
          </div>

          <button
            className="notification-panel__footer"
            type="button"
            onClick={openPlanner}
          >
            Открыть все задачи <ChevronRight size={15} />
          </button>
        </section>
      ) : null}
    </div>
  );
}
