"use client";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Swords,
  UsersRound,
} from "lucide-react";
import type { AuthUser } from "@/domain/auth/model";
import { BrandMark } from "../brand-mark";

const roleLabels = {
  owner: "Глава гильдии",
  officer: "Офицер",
  member: "Участник",
};

interface GuildDashboardProps {
  user: AuthUser;
  isSubmitting: boolean;
  onLogout: () => Promise<void>;
}

export function GuildDashboard({
  user,
  isSubmitting,
  onLogout,
}: GuildDashboardProps) {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <BrandMark compact />
        <nav aria-label="Основная навигация">
          <a className="is-current" href="#overview">Обзор</a>
          <a href="#members">Состав</a>
          <a href="#events">События</a>
        </nav>
        <div className="dashboard-header__actions">
          <button className="icon-button" type="button" aria-label="Уведомления">
            <Bell size={18} />
            <span className="notification-dot" />
          </button>
          <button
            className="profile-chip"
            type="button"
            onClick={onLogout}
            disabled={isSubmitting}
            title="Выйти из аккаунта"
          >
            <span>{user.displayName.slice(0, 1).toLocaleUpperCase("ru")}</span>
            <span className="profile-chip__copy">
              <strong>{user.displayName}</strong>
              <small>{roleLabels[user.role]}</small>
            </span>
            <LogOut size={16} />
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
            <div><small>Участники</small><strong>1</strong></div>
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
              {user.displayName.slice(0, 1).toLocaleUpperCase("ru")}
            </div>
            <h2>{user.displayName}</h2>
            <p>@{user.username}</p>
            <span className="role-badge">{roleLabels[user.role]}</span>
            <dl>
              <div><dt>Гильдия</dt><dd>{user.guildName}</dd></div>
              <div><dt>Статус</dt><dd className="online-value">В строю</dd></div>
            </dl>
          </aside>
        </div>
      </main>
    </div>
  );
}
