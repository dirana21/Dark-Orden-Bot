"use client";

import { LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import { BrandMark } from "./brand-mark";
import { AuthPanel } from "./auth/auth-panel";
import { GuildDashboard } from "./dashboard/guild-dashboard";

export function GuildPortal() {
  const auth = useAuthController();

  if (auth.isBooting) {
    return (
      <main className="boot-screen" aria-live="polite">
        <BrandMark />
        <span className="boot-screen__spinner" />
        <p>Проверяем доступ к штабу…</p>
      </main>
    );
  }

  if (auth.user) {
    return (
      <GuildDashboard
        user={auth.user}
        isSubmitting={auth.isSubmitting}
        onLogout={auth.logout}
      />
    );
  }

  return (
    <main className="auth-shell">
      <section
        className="brand-panel"
        role="img"
        aria-label="Рыцарь Dark Orden перед крепостью и стратегическим столом"
      >
        <div className="brand-panel__shade" />
        <div className="brand-panel__top">
          <BrandMark />
          <span className="mvp-badge">MVP · 01</span>
        </div>
        <div className="brand-panel__content">
          <span className="section-kicker">Неофициальный центр гильдии</span>
          <h2>Порядок.<br />Сила. Единство.</h2>
          <p>
            Единое пространство для участников Dark Orden — от профиля до
            будущих событий и отчётов Discord.
          </p>
          <div className="brand-panel__features">
            <span><ShieldCheck size={17} /> Защищённый профиль</span>
            <span><UsersRound size={17} /> Единый состав</span>
            <span><LockKeyhole size={17} /> Закрытая зона</span>
          </div>
        </div>
        <p className="brand-panel__legal">
          Фанатский проект сообщества. Не связан с Pearl Abyss.
        </p>
      </section>

      <section className="auth-side">
        <div className="auth-side__mobile-logo"><BrandMark /></div>
        <AuthPanel
          error={auth.error}
          disabled={auth.isSubmitting}
          onClearError={auth.clearError}
          onLogin={auth.login}
          onRegister={auth.register}
        />
        <p className="auth-side__footer">Dark Orden · Digital Guild Hub</p>
      </section>
    </main>
  );
}
