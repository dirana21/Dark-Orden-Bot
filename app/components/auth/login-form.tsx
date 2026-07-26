"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

interface LoginFormProps {
  disabled: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function LoginForm({ disabled, onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(username, password);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="field">
        <span>Логин</span>
        <span className="field__control">
          <UserRound size={18} aria-hidden="true" />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Ваш логин"
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
            autoComplete="current-password"
            placeholder="Введите пароль"
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

      <button className="primary-button" type="submit" disabled={disabled}>
        {disabled ? <span className="button-spinner" /> : "Войти в штаб"}
      </button>
    </form>
  );
}
