"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Gamepad2,
  LockKeyhole,
  Save,
  UserRound,
  X,
} from "lucide-react";
import type { AuthUser } from "@/domain/auth/model";

interface ProfileEditorProps {
  user: AuthUser;
  disabled: boolean;
  error: string;
  onClose: () => void;
  onClearError: () => void;
  onSave: (displayName: string, realName: string) => Promise<boolean>;
}

export function ProfileEditor({
  user,
  disabled,
  error,
  onClose,
  onClearError,
  onSave,
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
