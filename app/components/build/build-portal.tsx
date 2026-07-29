"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  LogOut,
  PencilLine,
  Plus,
  Search,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import { HttpBuildGateway } from "@/app/lib/build-client";
import { guildRoleLabels } from "@/app/lib/role-labels";
import {
  buildCharacterClasses,
  type BuildCharacterClass,
  type BuildCharacterSlot,
  type BuildProfile,
} from "@/domain/build/model";
import { BrandMark } from "../brand-mark";

const gateway = new HttpBuildGateway();

const emptyProfile: BuildProfile = {
  mainCharacter: null,
  mirrorCharacter: null,
  updatedAt: null,
};

export function BuildPortal() {
  const auth = useAuthController();
  const [character, setCharacter] = useState<BuildCharacterSlot>("main");
  const [profile, setProfile] = useState<BuildProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlot, setSavingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [selectingSlot, setSelectingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isBooting && !auth.user) {
      window.location.replace("/");
    }
  }, [auth.isBooting, auth.user]);

  useEffect(() => {
    if (!auth.user) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    gateway
      .get(controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setError("");
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить персонажей.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [auth.user]);

  useEffect(() => {
    if (!selectingSlot) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingSlot) {
        setSelectingSlot(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [savingSlot, selectingSlot]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return query
      ? buildCharacterClasses.filter((name) =>
          name.toLocaleLowerCase("ru").includes(query),
        )
      : buildCharacterClasses;
  }, [search]);

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
  const selectedCharacter = isMain
    ? profile.mainCharacter
    : profile.mirrorCharacter;

  function openCharacterPicker(slot: BuildCharacterSlot) {
    setCharacter(slot);
    setSelectingSlot(slot);
    setSearch("");
    setError("");
  }

  async function selectCharacter(nextCharacter: BuildCharacterClass) {
    if (!selectingSlot) {
      return;
    }

    const slot = selectingSlot;
    setSavingSlot(slot);
    setError("");
    try {
      setProfile(await gateway.setCharacter(slot, nextCharacter));
      setSelectingSlot(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить персонажа.",
      );
    } finally {
      setSavingSlot(null);
    }
  }

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
              <small>{isMain ? "Основной герой" : "Зеркало"}</small>
              <h2 id="build-character-title">
                {isLoading
                  ? "Загружаем…"
                  : selectedCharacter ?? "Герой не выбран"}
              </h2>
              <button
                className="build-character-card__select"
                type="button"
                onClick={() => openCharacterPicker(character)}
                disabled={isLoading || savingSlot !== null}
              >
                {selectedCharacter ? (
                  <PencilLine size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {selectedCharacter ? "Изменить героя" : "Добавить героя"}
              </button>
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
              aria-label={`Основной герой: ${profile.mainCharacter ?? "не выбран"}`}
              onClick={() => setCharacter("main")}
            >
              <UserRound size={20} />
              <span>
                <small>Основной герой</small>
                <strong>{profile.mainCharacter ?? "Добавить героя"}</strong>
              </span>
            </button>
            <button
              className={!isMain ? "is-active" : ""}
              type="button"
              aria-pressed={!isMain}
              aria-label={`Зеркало: ${profile.mirrorCharacter ?? "не выбрано"}`}
              onClick={() => setCharacter("mirror")}
            >
              <Copy size={20} />
              <span>
                <small>Зеркало</small>
                <strong>{profile.mirrorCharacter ?? "Добавить героя"}</strong>
              </span>
            </button>
            {error ? (
              <p className="build-page-error" role="alert">
                {error}
              </p>
            ) : null}
          </aside>
        </section>
      </main>

      {selectingSlot ? (
        <div
          className="build-picker-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingSlot) {
              setSelectingSlot(null);
            }
          }}
        >
          <section
            className="build-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="build-picker-title"
          >
            <header>
              <div>
                <span>
                  {selectingSlot === "main"
                    ? "Основной герой"
                    : "Зеркало"}
                </span>
                <h2 id="build-picker-title">Выберите персонажа</h2>
              </div>
              <button
                type="button"
                aria-label="Закрыть выбор персонажа"
                onClick={() => setSelectingSlot(null)}
                disabled={savingSlot !== null}
              >
                <X size={18} />
              </button>
            </header>

            <label className="build-picker-search">
              <Search size={17} />
              <span className="sr-only">Найти персонажа</span>
              <input
                autoFocus
                type="search"
                value={search}
                placeholder="Найти персонажа…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="build-picker-grid">
              {filteredClasses.map((name) => {
                const isSelected =
                  (selectingSlot === "main"
                    ? profile.mainCharacter
                    : profile.mirrorCharacter) === name;
                return (
                  <button
                    className={isSelected ? "is-selected" : ""}
                    type="button"
                    key={name}
                    disabled={savingSlot !== null}
                    onClick={() => void selectCharacter(name)}
                  >
                    <span>{name}</span>
                    {isSelected ? <Check size={15} /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
