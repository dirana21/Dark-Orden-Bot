"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import { guildRoleLabels } from "@/app/lib/role-labels";
import { BrandMark } from "../brand-mark";

type BuildCharacter = "main" | "mirror";

export function BuildPortal() {
  const auth = useAuthController();
  const [character, setCharacter] = useState<BuildCharacter>("main");

  useEffect(() => {
    if (!auth.isBooting && !auth.user) {
      window.location.replace("/");
    }
  }, [auth.isBooting, auth.user]);

  if (auth.isBooting || !auth.user) {
    return (
      <main className="boot-screen" aria-live="polite">
        <BrandMark />
        <span className="boot-screen__spinner" />
        <p>
          {auth.isBooting
            ? "Проверяем доступ к билду…"
            : "Возвращаем к авторизации…"}
        </p>
      </main>
    );
  }

  const user = auth.user;
  const isMain = character === "main";

  return (
    <div className="build-shell">
      <header className="dashboard-header build-header">
        <Link
          className="build-brand-link"
          href="/"
          aria-label="Вернуться в штаб"
        >
          <BrandMark compact />
        </Link>
        <nav aria-label="Основная навигация">
          <Link href="/">Обзор</Link>
          <Link href="/#planner">Мой план</Link>
          <Link href="/#members">Состав</Link>
          <Link href="/#events">События</Link>
          <Link className="is-current" href="/build">
            Билд
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
          <span className="profile-chip build-profile-static">
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

      <main className="build-main">
        <section className="build-hero" aria-labelledby="build-title">
          <div className="build-hero__copy">
            <span className="section-kicker">
              <Shield size={15} /> Персонажи
            </span>
            <h1 id="build-title">Билд</h1>
          </div>
          <span className="build-hero__status">
            {isMain ? "Основной герой" : "Зеркало"}
          </span>
        </section>

        <section className="build-character-stage">
          <article
            className="build-character-card"
            aria-live="polite"
            aria-labelledby="build-character-title"
          >
            <span className="build-character-card__mark" aria-hidden="true">
              {isMain ? (
                <UserRound size={42} />
              ) : (
                <Copy size={42} />
              )}
            </span>
            <div>
              <small>{isMain ? "Персонаж 01" : "Персонаж 02"}</small>
              <h2 id="build-character-title">
                {isMain ? "Основной герой" : "Зеркало"}
              </h2>
            </div>
          </article>

          <aside
            className="build-character-switcher"
            aria-label="Выбор персонажа"
          >
            <span>Персонажи</span>
            <button
              className={isMain ? "is-active" : ""}
              type="button"
              aria-pressed={isMain}
              onClick={() => setCharacter("main")}
            >
              <UserRound size={20} />
              <span>
                <small>Персонаж 01</small>
                <strong>Основной герой</strong>
              </span>
            </button>
            <button
              className={!isMain ? "is-active" : ""}
              type="button"
              aria-pressed={!isMain}
              onClick={() => setCharacter("mirror")}
            >
              <Copy size={20} />
              <span>
                <small>Персонаж 02</small>
                <strong>Зеркало</strong>
              </span>
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
}
