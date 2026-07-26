"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Medal,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { BlackSunStanding } from "@/domain/black-sun/model";
import {
  eventSessionNumbers,
  type EventRole,
  type EventSessionNumber,
} from "@/domain/events/model";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import { HttpBlackSunGateway } from "@/app/lib/black-sun-client";
import { eventRoleLabels } from "@/app/lib/event-role-labels";
import { guildRoleLabels } from "@/app/lib/role-labels";
import { BrandMark } from "../brand-mark";
import { EventRoleDialog } from "../events/event-role-dialog";
import { EventSessionSelector } from "../events/event-session-selector";
import { BlackSunIcon } from "./black-sun-icon";

const pointsFormatter = new Intl.NumberFormat("ru-RU");

function parseSessionNumber(value: string | null): EventSessionNumber | null {
  const parsed = Number(value);
  return eventSessionNumbers.includes(parsed as EventSessionNumber)
    ? (parsed as EventSessionNumber)
    : null;
}

function formatUpdatedAt(value: number | null): string {
  if (!value) {
    return "Очки не внесены";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

interface ScoreDialogProps {
  initialPoints: number;
  disabled: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (points: number) => Promise<void>;
}

function ScoreDialog({
  initialPoints,
  disabled,
  error,
  onClose,
  onSubmit,
}: ScoreDialogProps) {
  const [points, setPoints] = useState(
    initialPoints > 0 ? String(initialPoints) : "",
  );
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        onClose();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [disabled, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(points);
    if (
      !points.trim() ||
      !Number.isSafeInteger(parsed) ||
      parsed < 0 ||
      parsed > 999_999_999
    ) {
      setLocalError("Введите целое число от 0 до 999 999 999.");
      return;
    }
    setLocalError("");
    await onSubmit(parsed);
  }

  return (
    <div
      className="black-sun-score-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) {
          onClose();
        }
      }}
    >
      <section
        className="black-sun-score-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="black-sun-score-title"
      >
        <div className="black-sun-score-dialog__glow" aria-hidden="true" />
        <header>
          <div className="black-sun-score-dialog__mark">
            <BlackSunIcon size={28} />
          </div>
          <div>
            <span className="section-kicker">Личный результат</span>
            <h2 id="black-sun-score-title">Внести очки</h2>
          </div>
          <button
            className="profile-editor__close"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            disabled={disabled}
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={submit}>
          <label className="field">
            ОЧКИ ЧЁРНОГО СОЛНЦА
            <span className="field__control black-sun-points-control">
              <Medal size={18} aria-hidden="true" />
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min="0"
                max="999999999"
                step="1"
                value={points}
                onChange={(event) => {
                  setPoints(event.target.value);
                  setLocalError("");
                }}
                placeholder="Например, 125000"
                required
              />
            </span>
          </label>
          <p className="black-sun-score-dialog__hint">
            Новый результат заменит ранее внесённые очки только в этой сессии.
          </p>
          {localError || error ? (
            <p className="profile-editor__error" role="alert">
              {localError || error}
            </p>
          ) : null}
          <div className="profile-editor__actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
              disabled={disabled}
            >
              Отмена
            </button>
            <button className="primary-button" type="submit" disabled={disabled}>
              {disabled ? <span className="button-spinner" /> : <Medal size={16} />}
              {disabled ? "Сохраняем…" : "Сохранить очки"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function BlackSunPortal() {
  const auth = useAuthController();
  const searchParams = useSearchParams();
  const sessionNumber = parseSessionNumber(searchParams.get("session"));
  const gateway = useMemo(() => new HttpBlackSunGateway(), []);
  const [standings, setStandings] = useState<BlackSunStanding[]>([]);
  const [loadedSession, setLoadedSession] =
    useState<EventSessionNumber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isBooting && !auth.user) {
      window.location.replace("/");
    }
  }, [auth.isBooting, auth.user]);

  useEffect(() => {
    if (!auth.user || !sessionNumber) {
      return;
    }

    let active = true;
    gateway
      .list(sessionNumber)
      .then((entries) => {
        if (active) {
          setStandings(entries);
          setError("");
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить рейтинг.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadedSession(sessionNumber);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth.user, gateway, sessionNumber]);

  if (auth.isBooting || !auth.user) {
    return (
      <main className="boot-screen" aria-live="polite">
        <BrandMark />
        <span className="boot-screen__spinner" />
        <p>
          {auth.isBooting
            ? "Проверяем доступ к рейтингу…"
            : "Возвращаем к авторизации…"}
        </p>
      </main>
    );
  }

  const user = auth.user;
  const visibleStandings =
    loadedSession === sessionNumber ? standings : [];
  const isSessionLoading = isLoading || loadedSession !== sessionNumber;
  const currentStanding = visibleStandings.find(
    (entry) => entry.isCurrentUser,
  );
  const canParticipate = user.role !== "superadmin";

  const pageHeader = (
    <header className="dashboard-header black-sun-header">
      <Link
        className="black-sun-brand-link"
        href="/"
        aria-label="Вернуться в штаб"
      >
        <BrandMark compact />
      </Link>
      <nav aria-label="Основная навигация">
        <Link href="/">Обзор</Link>
        <Link href="/vengeful-souls">Ночью неупокоеных душ</Link>
        <Link className="is-current" href="/black-sun">
          Чёрное Солнце
        </Link>
      </nav>
      <div className="dashboard-header__actions">
        <Link
          className="icon-button"
          href="/"
          aria-label="Вернуться в штаб"
          title="Вернуться в штаб"
        >
          <ArrowLeft size={17} />
        </Link>
        <span className="profile-chip black-sun-profile-static">
          <span className="profile-avatar">
            {user.discord?.avatarUrl ? (
              <Image
                src={user.discord.avatarUrl}
                alt=""
                width={28}
                height={28}
                unoptimized
              />
            ) : (
              user.displayName.slice(0, 1).toLocaleUpperCase("ru")
            )}
          </span>
          <span className="profile-chip__copy">
            <strong>{user.displayName}</strong>
            <small>{guildRoleLabels[user.role]}</small>
          </span>
        </span>
        <button
          className="icon-button logout-button"
          type="button"
          aria-label="Выйти из аккаунта"
          title="Выйти из аккаунта"
          onClick={auth.logout}
          disabled={auth.isSubmitting}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );

  if (!sessionNumber) {
    return (
      <div className="black-sun-shell">
        {pageHeader}
        <EventSessionSelector
          basePath="/black-sun"
          icon={<BlackSunIcon size={112} />}
          kicker="Выберите боевой этап"
          title="Сессии Чёрного Солнца"
          subtitle="У события четыре отдельные сессии. Расписание появится здесь, когда будет утверждено."
        />
      </div>
    );
  }

  async function submitScore(points: number) {
    setIsSaving(true);
    setError("");
    try {
      setStandings(await gateway.submit(sessionNumber, points));
      setIsScoreOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить очки.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function selectRole(role: EventRole) {
    setIsSavingRole(true);
    setError("");
    try {
      setStandings(await gateway.selectRole(sessionNumber, role));
      setIsRoleOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить роль.",
      );
    } finally {
      setIsSavingRole(false);
    }
  }

  async function reloadStandings() {
    setIsLoading(true);
    setError("");
    try {
      setStandings(await gateway.list(sessionNumber));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось обновить рейтинг.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="black-sun-shell">
      {pageHeader}

      <main className="black-sun-main">
        <section className="black-sun-hero">
          <div className="black-sun-hero__symbol">
            <BlackSunIcon size={104} />
          </div>
          <div className="black-sun-hero__copy">
            <span className="section-kicker">
              Боевой рейтинг · Сессия {sessionNumber}
            </span>
            <h1>
              Чёрное Солнце <span>/ Black Sun</span>
            </h1>
            <p>
              Выберите роль и внесите результат этой сессии. Таблица автоматически
              распределит до 50 участников от наибольшего количества очков к
              наименьшему.
            </p>
          </div>
          <div className="black-sun-hero__action">
            <div className="event-session-actions">
              <button
                className="secondary-button event-role-button"
                type="button"
                onClick={() => {
                  setError("");
                  setIsRoleOpen(true);
                }}
                disabled={!canParticipate}
              >
                <CheckCircle2 size={17} />
                {currentStanding?.eventRole ? "Изменить роль" : "Выбрать роль"}
              </button>
              <button
                className="primary-button black-sun-score-button"
                type="button"
                onClick={() => {
                  setError("");
                  setIsScoreOpen(true);
                }}
                disabled={!canParticipate}
              >
                <Plus size={17} /> Внести очки
              </button>
            </div>
            {!canParticipate ? (
              <small>Скрытая учётная запись не участвует в рейтинге.</small>
            ) : currentStanding?.eventRole ? (
              <small className="event-role-confirmation">
                <CheckCircle2 size={14} /> Вы выбрали роль:{" "}
                <strong>{eventRoleLabels[currentStanding.eventRole]}</strong>
              </small>
            ) : (
              <small>Роль для этой сессии пока не выбрана.</small>
            )}
            {currentStanding?.updatedAt ? (
              <small>
                Ваш результат:{" "}
                <strong>{pointsFormatter.format(currentStanding.points)}</strong>
              </small>
            ) : null}
            <Link className="event-session-switch" href="/black-sun">
              Выбрать другую сессию
            </Link>
          </div>
        </section>

        <section className="black-sun-leaderboard">
          <header className="black-sun-leaderboard__header">
            <div>
              <span className="section-kicker">Таблица участников</span>
              <h2>Сессия {sessionNumber} · Dark Orden</h2>
            </div>
            <div className="black-sun-leaderboard__meta">
              <span>{visibleStandings.length} из 50</span>
              <button
                className="icon-button"
                type="button"
                onClick={reloadStandings}
                disabled={isSessionLoading}
                aria-label="Обновить рейтинг"
                title="Обновить рейтинг"
              >
                <RefreshCw
                  className={isSessionLoading ? "is-spinning" : ""}
                  size={16}
                />
              </button>
            </div>
          </header>

          {error && !isScoreOpen && !isSessionLoading ? (
            <p className="black-sun-page-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="black-sun-table-wrap">
            <table className="black-sun-table">
              <thead>
                <tr>
                  <th scope="col">Место</th>
                  <th scope="col">Участник</th>
                  <th scope="col">Роль</th>
                  <th scope="col">Обновлено</th>
                  <th scope="col">Очки</th>
                </tr>
              </thead>
              <tbody>
                {isSessionLoading && visibleStandings.length === 0 ? (
                  <tr>
                    <td className="black-sun-table__state" colSpan={5}>
                      Загружаем рейтинг Чёрного Солнца…
                    </td>
                  </tr>
                ) : visibleStandings.length === 0 ? (
                  <tr>
                    <td className="black-sun-table__state" colSpan={5}>
                      В рейтинге пока нет участников.
                    </td>
                  </tr>
                ) : (
                  visibleStandings.map((entry) => (
                    <tr
                      className={entry.isCurrentUser ? "is-current-user" : ""}
                      key={entry.userId}
                    >
                      <td>
                        <span
                          className={`black-sun-rank black-sun-rank--${Math.min(
                            entry.rank,
                            4,
                          )}`}
                        >
                          {entry.rank <= 3 ? <Medal size={16} /> : null}
                          {entry.rank}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`event-role-badge event-role-badge--${
                            entry.eventRole ?? "empty"
                          }`}
                        >
                          {entry.eventRole
                            ? eventRoleLabels[entry.eventRole]
                            : "Не выбрана"}
                        </span>
                      </td>
                      <td>
                        <span className="black-sun-player">
                          <span className="black-sun-player__avatar">
                            {entry.avatarUrl ? (
                              <Image
                                src={entry.avatarUrl}
                                alt=""
                                width={36}
                                height={36}
                                unoptimized
                              />
                            ) : (
                              entry.displayName
                                .slice(0, 1)
                                .toLocaleUpperCase("ru")
                            )}
                          </span>
                          <span>
                            <strong>{entry.displayName}</strong>
                            {entry.isCurrentUser ? <small>Это вы</small> : null}
                          </span>
                        </span>
                      </td>
                      <td>
                        <time>
                          {formatUpdatedAt(entry.updatedAt)}
                        </time>
                      </td>
                      <td className="black-sun-points">
                        {pointsFormatter.format(entry.points)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isScoreOpen ? (
        <ScoreDialog
          initialPoints={currentStanding?.points ?? 0}
          disabled={isSaving}
          error={error}
          onClose={() => {
            if (!isSaving) {
              setError("");
              setIsScoreOpen(false);
            }
          }}
          onSubmit={submitScore}
        />
      ) : null}
      {isRoleOpen ? (
        <EventRoleDialog
          currentRole={currentStanding?.eventRole ?? null}
          disabled={isSavingRole}
          error={error}
          sessionNumber={sessionNumber}
          onClose={() => {
            if (!isSavingRole) {
              setError("");
              setIsRoleOpen(false);
            }
          }}
          onSelect={selectRole}
        />
      ) : null}
    </div>
  );
}
