import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import {
  eventSessionNumbers,
  type EventSessionNumber,
} from "@/domain/events/model";
import type { ReactNode } from "react";

interface EventSessionSelectorProps {
  basePath: string;
  icon: ReactNode;
  kicker: string;
  title: string;
  subtitle: string;
}

export function EventSessionSelector({
  basePath,
  icon,
  kicker,
  title,
  subtitle,
}: EventSessionSelectorProps) {
  return (
    <main className="black-sun-main event-session-main">
      <section className="event-session-selector">
        <header className="event-session-selector__header">
          <div className="event-session-selector__icon">{icon}</div>
          <div>
            <span className="section-kicker">{kicker}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>

        <div className="event-session-grid" aria-label="Сессии события">
          {eventSessionNumbers.map((sessionNumber) => (
            <SessionCard
              basePath={basePath}
              key={sessionNumber}
              sessionNumber={sessionNumber}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SessionCard({
  basePath,
  sessionNumber,
}: {
  basePath: string;
  sessionNumber: EventSessionNumber;
}) {
  return (
    <Link
      className="event-session-card"
      href={`${basePath}?session=${sessionNumber}`}
    >
      <span className="event-session-card__number">
        {String(sessionNumber).padStart(2, "0")}
      </span>
      <span className="event-session-card__copy">
        <strong>Сессия {sessionNumber}</strong>
        <small>
          <CalendarClock size={13} /> Время будет объявлено
        </small>
      </span>
      <ChevronRight size={19} />
    </Link>
  );
}
