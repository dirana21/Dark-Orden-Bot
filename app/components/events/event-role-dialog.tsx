"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import {
  eventRoles,
  type EventRole,
  type EventSessionNumber,
} from "@/domain/events/model";
import {
  eventRoleDescriptions,
  eventRoleLabels,
} from "@/app/lib/event-role-labels";

interface EventRoleDialogProps {
  currentRole: EventRole | null;
  disabled: boolean;
  error: string;
  sessionNumber: EventSessionNumber;
  onClose: () => void;
  onSelect: (role: EventRole) => Promise<void>;
}

export function EventRoleDialog({
  currentRole,
  disabled,
  error,
  sessionNumber,
  onClose,
  onSelect,
}: EventRoleDialogProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disabled) {
        onClose();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [disabled, onClose]);

  return (
    <div
      className="black-sun-score-modal event-role-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) {
          onClose();
        }
      }}
    >
      <section
        className="black-sun-score-dialog event-role-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-role-title"
      >
        <header>
          <div>
            <span className="section-kicker">Сессия {sessionNumber}</span>
            <h2 id="event-role-title">Выберите роль</h2>
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

        <div className="event-role-options">
          {eventRoles.map((role) => (
            <button
              className={`event-role-option event-role-option--${role}${
                currentRole === role ? " is-selected" : ""
              }`}
              type="button"
              key={role}
              onClick={() => onSelect(role)}
              disabled={disabled}
            >
              <span className="event-role-option__mark" aria-hidden="true" />
              <span>
                <strong>{eventRoleLabels[role]}</strong>
                <small>{eventRoleDescriptions[role]}</small>
              </span>
            </button>
          ))}
        </div>

        {error ? (
          <p className="profile-editor__error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
