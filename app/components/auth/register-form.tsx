"use client";

import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

interface RegisterFormProps {
  disabled: boolean;
  onSubmit: (
    displayName: string,
    username: string,
    password: string,
    guildIdentifier: string,
  ) => Promise<void>;
}

export function RegisterForm({ disabled, onSubmit }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [guildIdentifier, setGuildIdentifier] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setLocalError("Пароли не совпадают.");
      return;
    }
    setLocalError("");
    await onSubmit(displayName, username, password, guildIdentifier);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="field">
        <span>Имя персонажа</span>
        <span className="field__control">
          <ShieldCheck size={18} aria-hidden="true" />
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="nickname"
            placeholder="Например, Dirana"
            minLength={2}
            maxLength={40}
            required
          />
        </span>
      </label>

      <label className="field">
        <span>Идентификатор гильдии</span>
        <span className="field__control field__control--guild-code">
          <KeyRound size={18} aria-hidden="true" />
          <input
            value={guildIdentifier}
            onChange={(event) => setGuildIdentifier(event.target.value)}
            type="password"
            autoComplete="off"
            placeholder="Получите у главы или офицера"
            minLength={4}
            maxLength={64}
            required
          />
        </span>
        <small className="guild-code-hint">
          Закрытый код доступа для участников Dark Orden.
        </small>
      </label>

      <label className="field">
        <span>Логин</span>
        <span className="field__control">
          <UserRound size={18} aria-hidden="true" />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="3–24 символа"
            minLength={3}
            maxLength={24}
            required
          />
        </span>
      </label>

      <label className="field">
        <span>Пароль</span>
        <span className="field__control">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Минимум 10 символов"
            minLength={10}
            maxLength={128}
            required
          />
          <button
            className="field__reveal"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      <label className="field">
        <span>Повторите пароль</span>
        <span className="field__control">
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ещё раз"
            minLength={10}
            maxLength={128}
            required
          />
        </span>
      </label>

      {localError && (
        <p className="form-message form-message--error" role="alert">
          {localError}
        </p>
      )}

      <p className="password-hint">
        Используйте минимум 10 символов, букву и цифру.
      </p>

      <button className="primary-button" type="submit" disabled={disabled}>
        {disabled ? <span className="button-spinner" /> : "Создать аккаунт"}
      </button>
    </form>
  );
}
