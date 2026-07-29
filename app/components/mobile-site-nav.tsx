"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CalendarDays,
  Hammer,
  Home,
  ListTodo,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { BlackSunIcon } from "./black-sun/black-sun-icon";
import { BrandMark } from "./brand-mark";
import { VengefulSoulsIcon } from "./vengeful-souls/vengeful-souls-icon";

type MobileSiteNavSection =
  | "overview"
  | "planner"
  | "members"
  | "events"
  | "build"
  | "vengeful-souls"
  | "black-sun";

interface MobileSiteNavProps {
  current: MobileSiteNavSection;
}

const primaryItems = [
  {
    id: "overview",
    href: "/#overview",
    label: "Обзор",
    description: "Главная страница штаба",
    icon: Home,
  },
  {
    id: "planner",
    href: "/#planner",
    label: "Мой план",
    description: "Ежедневные, недельные и месячные задачи",
    icon: ListTodo,
  },
  {
    id: "members",
    href: "/#members",
    label: "Состав",
    description: "Профиль и участники гильдии",
    icon: UsersRound,
  },
  {
    id: "events",
    href: "/#events",
    label: "События",
    description: "Лента и игровые активности",
    icon: CalendarDays,
  },
  {
    id: "build",
    href: "/build",
    label: "Билд",
    description: "Герои, навыки, сокеты и сигилы",
    icon: Hammer,
  },
] as const;

export function MobileSiteNav({ current }: MobileSiteNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className="mobile-site-nav">
      <button
        className="mobile-site-nav__trigger"
        type="button"
        aria-controls={drawerId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X size={19} /> : <Menu size={19} />}
        <span>Меню</span>
      </button>

      {isOpen
        ? createPortal(
          <div className="mobile-site-nav__layer">
          <button
            className="mobile-site-nav__backdrop"
            type="button"
            aria-label="Закрыть меню"
            onClick={close}
          />
          <aside
            className="mobile-site-nav__drawer"
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Навигация по сайту"
          >
            <header>
              <BrandMark compact />
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={close}
              >
                <X size={19} />
              </button>
            </header>

            <div className="mobile-site-nav__intro">
              <span>Командный центр</span>
              <strong>Навигация</strong>
              <p>Все разделы Dark Orden в одном месте.</p>
            </div>

            <nav aria-label="Разделы сайта">
              {primaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className={current === item.id ? "is-current" : ""}
                    href={item.href}
                    key={item.id}
                    onClick={close}
                  >
                    <span><Icon size={18} /></span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <section>
              <span>Боевые события</span>
              <Link
                className={
                  current === "vengeful-souls" ? "is-current" : ""
                }
                href="/vengeful-souls"
                onClick={close}
              >
                <VengefulSoulsIcon size={42} />
                <span>
                  <strong>Ночь неупокоеных душ</strong>
                  <small>Рейтинг по четырём сессиям</small>
                </span>
              </Link>
              <Link
                className={current === "black-sun" ? "is-current" : ""}
                href="/black-sun"
                onClick={close}
              >
                <BlackSunIcon size={42} />
                <span>
                  <strong>Чёрное Солнце</strong>
                  <small>Рейтинг по четырём сессиям</small>
                </span>
              </Link>
            </section>
          </aside>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}
