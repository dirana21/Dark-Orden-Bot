"use client";

import { useState } from "react";
import { CircleCheck, Swords } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthMode = "login" | "register";

interface AuthPanelProps {
  error: string;
  disabled: boolean;
  onClearError: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (
    displayName: string,
    username: string,
    password: string,
  ) => Promise<void>;
}

export function AuthPanel({
  error,
  disabled,
  onClearError,
  onLogin,
  onRegister,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  function chooseMode(nextMode: AuthMode) {
    setMode(nextMode);
    onClearError();
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-panel__eyebrow">
        <Swords size={15} />
        <span>Закрытый контур гильдии</span>
      </div>
      <h1 id="auth-title">
        {mode === "login" ? "С возвращением" : "Вступить в строй"}
      </h1>
      <p className="auth-panel__subtitle">
        {mode === "login"
          ? "Войдите, чтобы открыть личный кабинет участника Dark Orden."
          : "Создайте аккаунт — профиль будет сразу привязан к Dark Orden."}
      </p>

      <div className="auth-tabs" role="tablist" aria-label="Авторизация">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "is-active" : ""}
          onClick={() => chooseMode("login")}
        >
          Вход
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "is-active" : ""}
          onClick={() => chooseMode("register")}
        >
          Регистрация
        </button>
      </div>

      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}

      {mode === "login" ? (
        <LoginForm disabled={disabled} onSubmit={onLogin} />
      ) : (
        <RegisterForm disabled={disabled} onSubmit={onRegister} />
      )}

      <div className="auth-panel__trust">
        <CircleCheck size={16} />
        <span>Пароли защищены стойким хешированием, сессии — HttpOnly cookie.</span>
      </div>
    </section>
  );
}
