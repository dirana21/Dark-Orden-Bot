"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Gamepad2,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Save,
  Unlink,
  UserRound,
  X,
} from "lucide-react";
import type { AuthUser } from "@/domain/auth/model";

interface ProfileEditorProps {
  user: AuthUser;
  disabled: boolean;
  error: string;
  discordStatus: string;
  onClose: () => void;
  onClearError: () => void;
  onSave: (displayName: string, realName: string) => Promise<boolean>;
  onDisconnectDiscord: () => Promise<boolean>;
}

export function ProfileEditor({
  user,
  disabled,
  error,
  discordStatus,
  onClose,
  onClearError,
  onSave,
  onDisconnectDiscord,
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [realName, setRealName] = useState(user.realName ?? "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [disabled, onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onSave(displayName, realName)) {
      onClose();
    }
  };

  return (
    <div
      className="profile-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) {
          onClose();
        }
      }}
    >
      <section
        className="profile-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
      >
        <div className="profile-editor__glow" aria-hidden="true" />
        <header className="profile-editor__header">
          <div>
            <span className="section-kicker">
              <BadgeCheck size={15} /> Личные данные
            </span>
            <h2 id="profile-editor-title">Редактировать профиль</h2>
            <p>Настройте имя, под которым вас увидит гильдия.</p>
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

        <form className="profile-editor__form" onSubmit={submit}>
          <section className="discord-connect-card" aria-label="Подключение Discord">
            <div className="discord-connect-card__heading">
              <span className="discord-connect-card__logo" aria-hidden="true">
                <MessageCircle size={21} />
              </span>
              <div>
                <strong>Discord</strong>
                <small>
                  {user.discord
                    ? "Аккаунт подключён"
                    : "Перенесите ник и фотографию в профиль"}
                </small>
              </div>
              <span
                className={
                  user.discord
                    ? "discord-connect-card__state is-connected"
                    : "discord-connect-card__state"
                }
              >
                {user.discord ? "Подключён" : "Не подключён"}
              </span>
            </div>

            {user.discord ? (
              <div className="discord-connect-card__profile">
                <span className="discord-connect-card__avatar">
                  {user.discord.avatarUrl ? (
                    <Image
                      src={user.discord.avatarUrl}
                      alt=""
                      width={38}
                      height={38}
                      unoptimized
                    />
                  ) : (
                    user.discord.displayName.slice(0, 1).toLocaleUpperCase("ru")
                  )}
                </span>
                <span>
                  <strong>{user.discord.displayName}</strong>
                  <small>@{user.discord.username}</small>
                </span>
                <a
                  className="discord-connect-card__refresh"
                  href="/api/profile/discord/start"
                  aria-label="Обновить ник и фотографию из Discord"
                  title="Обновить из Discord"
                >
                  <RefreshCw size={16} />
                </a>
                <button
                  className="discord-connect-card__unlink"
                  type="button"
                  onClick={onDisconnectDiscord}
                  disabled={disabled}
                  aria-label="Отключить Discord"
                  title="Отключить Discord"
                >
                  <Unlink size={16} />
                </button>
              </div>
            ) : (
              <a
                className="discord-connect-button"
                href="/api/profile/discord/start"
              >
                <MessageCircle size={17} />
                Подключить Discord
              </a>
            )}

            {discordStatus ? (
              <p
                className={
                  discordStatus === "connected" ||
                  discordStatus === "disconnected"
                    ? "discord-connect-card__message is-success"
                    : "discord-connect-card__message"
                }
                role="status"
              >
                {discordStatus === "connected"
                  ? "Ник и фотография успешно перенесены из Discord."
                  : discordStatus === "disconnected"
                    ? "Discord отключён от профиля."
                    : discordStatus === "cancelled"
                      ? "Подключение Discord отменено."
                      : discordStatus === "already_linked"
                        ? "Этот Discord уже подключён к другому участнику."
                        : discordStatus === "unavailable"
                          ? "Подключение Discord пока не настроено."
                          : discordStatus === "login_required"
                            ? "Сначала войдите в аккаунт заново."
                            : "Не удалось подключить Discord. Попробуйте ещё раз."}
              </p>
            ) : null}
          </section>

          <label className="field">
            ИГРОВОЙ НИК
            <span className="field__control">
              <Gamepad2 size={17} />
              <input
                autoFocus
                required
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  onClearError();
                }}
                placeholder="Например, Dirana"
              />
            </span>
            <small className="profile-editor__hint">
              Его можно менять в любое время.
            </small>
          </label>

          <label className="field">
            <span>
              РЕАЛЬНОЕ ИМЯ <span className="field__optional">необязательно</span>
            </span>
            <span className="field__control">
              <UserRound size={17} />
              <input
                minLength={2}
                maxLength={60}
                autoComplete="name"
                value={realName}
                onChange={(event) => {
                  setRealName(event.target.value);
                  onClearError();
                }}
                placeholder="Как к вам обращаться"
              />
            </span>
          </label>

          <label className="field">
            ЛОГИН ДЛЯ ВХОДА
            <span className="field__control field__control--readonly">
              <LockKeyhole size={17} />
              <input value={user.username} readOnly aria-readonly="true" />
            </span>
            <small className="profile-editor__hint">
              Логин защищён и остаётся неизменным.
            </small>
          </label>

          {error ? (
            <p className="profile-editor__error" role="alert">
              {error}
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
              <Save size={16} />
              {disabled ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
