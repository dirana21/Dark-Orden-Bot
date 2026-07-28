"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  ChevronRight,
  LogOut,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Swords,
  UsersRound,
} from "lucide-react";
import type { AuthUser } from "@/domain/auth/model";
import { guildRoleLabels } from "@/app/lib/role-labels";
import { BlackSunIcon } from "../black-sun/black-sun-icon";
import { BrandMark } from "../brand-mark";
import { PlannerNotifications } from "../notifications/planner-notifications";
import { ProfileEditor } from "../profile/profile-editor";
import { WeeklyPlanner } from "../planner/weekly-planner";
import { VengefulSoulsIcon } from "../vengeful-souls/vengeful-souls-icon";

interface GuildDashboardProps {
  user: AuthUser;
  isSubmitting: boolean;
  error: string;
  onClearError: () => void;
  onUpdateProfile: (
    displayName: string,
    realName: string,
  ) => Promise<boolean>;
  onDisconnectDiscord: () => Promise<boolean>;
  onLogout: () => Promise<void>;
}

export function GuildDashboard({
  user,
  isSubmitting,
  error,
  onClearError,
  onUpdateProfile,
  onDisconnectDiscord,
  onLogout,
}: GuildDashboardProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [discordStatus, setDiscordStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("discord");
    if (!result) {
      return;
    }

    params.delete("discord");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
    const timer = window.setTimeout(() => {
      setDiscordStatus(result);
      setIsProfileOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeProfile = useCallback(() => {
    onClearError();
    setDiscordStatus("");
    setIsProfileOpen(false);
  }, [onClearError]);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <BrandMark compact />
        <nav aria-label="Основная навигация">
          <a className="is-current" href="#overview">Обзор</a>
          <a href="#planner">Мой план</a>
          <a href="#members">Состав</a>
          <a href="#events">События</a>
        </nav>
        <div className="dashboard-header__actions">
          <div
            className="event-nav-desktop"
            role="navigation"
            aria-label="События гильдии"
          >
            <Link
              className="event-nav-card vengeful-souls-nav-card"
              href="/vengeful-souls"
              aria-label="Открыть рейтинг Ночи неупокоеных душ"
              title="Ночью неупокоеных душ / Night of Vengeful Souls"
            >
              <VengefulSoulsIcon size={44} />
              <span className="event-nav-card__copy">
                <strong>Ночью неупокоеных душ</strong>
                <small>Night of Vengeful Souls</small>
              </span>
            </Link>
            <Link
              className="event-nav-card black-sun-event-card"
              href="/black-sun"
              aria-label="Открыть рейтинг Чёрного Солнца"
              title="Чёрное Солнце / Black Sun"
            >
              <BlackSunIcon size={44} />
              <span className="event-nav-card__copy">
                <strong>Чёрное Солнце</strong>
                <small>Black Sun</small>
              </span>
            </Link>
          </div>
          <details className="event-nav-mobile">
            <summary
              aria-label="Открыть список событий"
              title="События"
            >
              <Sparkles size={19} />
              <span className="event-nav-mobile__dot" />
            </summary>
            <nav className="event-nav-mobile__menu" aria-label="События гильдии">
              <Link
                className="event-nav-mobile__item event-nav-mobile__item--vengeful"
                href="/vengeful-souls"
              >
                <VengefulSoulsIcon size={42} />
                <span className="event-nav-card__copy">
                  <strong>Ночью неупокоеных душ</strong>
                  <small>Night of Vengeful Souls</small>
                </span>
              </Link>
              <Link
                className="event-nav-mobile__item event-nav-mobile__item--black-sun"
                href="/black-sun"
              >
                <BlackSunIcon size={42} />
                <span className="event-nav-card__copy">
                  <strong>Чёрное Солнце</strong>
                  <small>Black Sun</small>
                </span>
              </Link>
            </nav>
          </details>
          <PlannerNotifications />
          <button
            className="profile-chip"
            type="button"
            onClick={() => {
              onClearError();
              setIsProfileOpen(true);
            }}
            disabled={isSubmitting}
            title="Редактировать профиль"
          >
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
            <PencilLine size={15} />
          </button>
          <button
            className="icon-button logout-button"
            type="button"
            aria-label="Выйти из аккаунта"
            title="Выйти из аккаунта"
            onClick={onLogout}
            disabled={isSubmitting}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="dashboard-main" id="overview">
        <section className="welcome-banner">
          <div>
            <span className="section-kicker">
              <ShieldCheck size={15} /> Доступ подтверждён
            </span>
            <h1>Добро пожаловать в штаб, {user.displayName}</h1>
            <p>
              Ваш профиль связан с гильдией <strong>{user.guildName}</strong>.
              Здесь появятся состав, события и отчёты Discord.
            </p>
          </div>
          <div className="welcome-banner__sigil" aria-hidden="true">
            <span>DO</span>
          </div>
        </section>

        <section className="stats-grid" aria-label="Сводка гильдии">
          <article className="stat-card">
            <span className="stat-card__icon"><UsersRound size={20} /></span>
            <div>
              <small>Участники</small>
              <strong>{user.guildMemberCount}</strong>
            </div>
            <span className="stat-card__tag">MVP</span>
          </article>
          <article className="stat-card">
            <span className="stat-card__icon"><CalendarDays size={20} /></span>
            <div><small>Ближайшие события</small><strong>0</strong></div>
            <span className="stat-card__tag stat-card__tag--muted">Скоро</span>
          </article>
          <article className="stat-card">
            <span className="stat-card__icon"><Swords size={20} /></span>
            <div>
              <small>Статус гильдии</small>
              <strong className="stat-card__word">Активна</strong>
            </div>
            <span className="status-pulse" />
          </article>
        </section>

        <WeeklyPlanner userRole={user.role} />

        <div className="dashboard-grid">
          <section className="dashboard-card" id="events">
            <div className="dashboard-card__heading">
              <div>
                <span className="section-kicker">Лента штаба</span>
                <h2>Последние события</h2>
              </div>
              <button type="button" className="text-button">
                Все события <ChevronRight size={16} />
              </button>
            </div>
            <div className="timeline">
              <article>
                <span className="timeline__icon"><Sparkles size={17} /></span>
                <div>
                  <strong>Аккаунт создан</strong>
                  <p>{user.displayName} присоединился к цифровому штабу.</p>
                  <small>Только что</small>
                </div>
              </article>
              <article className="is-upcoming">
                <span className="timeline__icon">
                  <MessageSquareText size={17} />
                </span>
                <div>
                  <strong>Интеграция с Discord</strong>
                  <p>Сообщения и отчёты бота появятся в этой ленте.</p>
                  <small>Следующий этап</small>
                </div>
              </article>
            </div>
          </section>

          <aside className="dashboard-card member-card" id="members">
            <span className="section-kicker">Ваш профиль</span>
            <div className="member-card__avatar">
              {user.discord?.avatarUrl ? (
                <Image
                  src={user.discord.avatarUrl}
                  alt=""
                  width={72}
                  height={72}
                  unoptimized
                />
              ) : (
                user.displayName.slice(0, 1).toLocaleUpperCase("ru")
              )}
            </div>
            <h2>{user.displayName}</h2>
            <p>@{user.username}</p>
            <p
              className={
                user.realName
                  ? "member-card__real-name"
                  : "member-card__real-name is-empty"
              }
            >
              {user.realName ?? "Реальное имя не указано"}
            </p>
            <span className="role-badge">{guildRoleLabels[user.role]}</span>
            <dl>
              <div><dt>Гильдия</dt><dd>{user.guildName}</dd></div>
              <div><dt>Статус</dt><dd className="online-value">В строю</dd></div>
            </dl>
            <button
              className="member-card__edit"
              type="button"
              onClick={() => {
                onClearError();
                setIsProfileOpen(true);
              }}
            >
              <PencilLine size={14} /> Редактировать профиль
            </button>
          </aside>
        </div>
      </main>
      {isProfileOpen ? (
        <ProfileEditor
          user={user}
          disabled={isSubmitting}
          error={error}
          discordStatus={discordStatus}
          onClose={closeProfile}
          onClearError={onClearError}
          onSave={onUpdateProfile}
          onDisconnectDiscord={async () => {
            const disconnected = await onDisconnectDiscord();
            if (disconnected) {
              setDiscordStatus("disconnected");
            }
            return disconnected;
          }}
        />
      ) : null}
    </div>
  );
}
