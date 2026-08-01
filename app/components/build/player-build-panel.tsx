"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Crown,
  Gem,
  GripVertical,
  Plus,
  Save,
  Sprout,
  Swords,
  Trash2,
  UsersRound,
} from "lucide-react";
import { HttpPlayerBuildGateway } from "@/app/lib/build-client";
import type {
  BuildCharacterClass,
  BuildSkill,
} from "@/domain/build/model";
import {
  PLAYER_BUILD_SLOT_LIMIT,
  playerBuildSetupLabels,
  playerBuildSetupTypes,
  type PlayerBuildSetupType,
  type PlayerBuildSlot,
} from "@/domain/build/player-build-model";
import type { BuildSigil } from "@/domain/build/sigil-model";
import { SigilSocketIcon } from "./sigil-socket-icon";

const gateway = new HttpPlayerBuildGateway();
const dragType = "application/x-dark-orden-build";
const setupIcons = {
  "mass-pvp": UsersRound,
  pvp: Swords,
  pve: Sprout,
  bosses: Crown,
} satisfies Record<PlayerBuildSetupType, typeof Swords>;

type DragPayload =
  | { kind: "skill"; skillId: string }
  | { kind: "slot"; index: number };

interface PlayerBuildPanelProps {
  character: BuildCharacterClass;
  displayName: string;
  skills: BuildSkill[];
  sigils: BuildSigil[];
  isSkillsLoading: boolean;
}

function serializeSlots(slots: PlayerBuildSlot[]): string {
  return JSON.stringify(slots);
}

function writeDragPayload(
  event: React.DragEvent,
  payload: DragPayload,
) {
  const encoded = JSON.stringify(payload);
  event.dataTransfer.effectAllowed =
    payload.kind === "skill" ? "copy" : "move";
  event.dataTransfer.setData(dragType, encoded);
  event.dataTransfer.setData("text/plain", encoded);
}

function readDragPayload(
  event: React.DragEvent,
): DragPayload | null {
  try {
    const parsed = JSON.parse(
      event.dataTransfer.getData(dragType) ||
        event.dataTransfer.getData("text/plain"),
    ) as DragPayload;
    if (
      parsed.kind === "skill" &&
      typeof parsed.skillId === "string"
    ) {
      return parsed;
    }
    if (
      parsed.kind === "slot" &&
      Number.isInteger(parsed.index)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function PlayerBuildPanel({
  character,
  displayName,
  skills,
  sigils,
  isSkillsLoading,
}: PlayerBuildPanelProps) {
  const [slots, setSlots] = useState<PlayerBuildSlot[]>([]);
  const [setupType, setSetupType] =
    useState<PlayerBuildSetupType>("mass-pvp");
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] =
    useState<number | null>(null);
  const [activeSocketIndex, setActiveSocketIndex] = useState(0);
  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) {
          return null;
        }
        setIsLoading(true);
        setError("");
        setActiveSlotIndex(null);
        setActiveSocketIndex(0);
        return gateway.get(character, setupType, controller.signal);
      })
      .then((loadout) => {
        if (!loadout) {
          return;
        }
        setSlots(loadout.slots);
        setSavedSnapshot(serializeSlots(loadout.slots));
        setUpdatedAt(loadout.updatedAt);
        setActiveSlotIndex(loadout.slots.length > 0 ? 0 : null);
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить личный билд.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [character, setupType]);

  const skillsById = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills],
  );
  const selectedSkillIds = useMemo(
    () => new Set(slots.map((slot) => slot.skillId)),
    [slots],
  );
  const availableSkills = useMemo(
    () => skills.filter((skill) => !selectedSkillIds.has(skill.id)),
    [selectedSkillIds, skills],
  );
  const activeSlot =
    activeSlotIndex === null ? null : slots[activeSlotIndex] ?? null;
  const activeSkill = activeSlot
    ? skillsById.get(activeSlot.skillId) ?? null
    : null;
  const activeSocketType =
    activeSkill?.socketTypes[activeSocketIndex] ?? null;
  const matchingSigils = activeSocketType
    ? sigils.filter((sigil) => sigil.category === activeSocketType)
    : [];
  const hasUnavailableSkills = slots.some(
    (slot) => !skillsById.has(slot.skillId),
  );
  const isDirty = serializeSlots(slots) !== savedSnapshot;

  function addSkill(skillId: string, targetIndex = slots.length) {
    if (
      slots.length >= PLAYER_BUILD_SLOT_LIMIT ||
      selectedSkillIds.has(skillId)
    ) {
      return;
    }
    const index = Math.min(targetIndex, slots.length);
    setSlots((current) => {
      const next = [...current];
      const skill = skillsById.get(skillId);
      next.splice(index, 0, {
        skillId,
        sigilIds: [],
        comboEnabled: skill?.comboAvailable ? false : null,
        alternateEnabled: false,
      });
      return next;
    });
    setActiveSlotIndex(index);
    setActiveSocketIndex(0);
    setError("");
  }

  function moveSlot(fromIndex: number, targetIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= slots.length ||
      fromIndex === targetIndex
    ) {
      return;
    }
    const insertionIndex = Math.min(
      fromIndex < targetIndex ? targetIndex - 1 : targetIndex,
      slots.length - 1,
    );
    setSlots((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(insertionIndex, 0, moved);
      return next;
    });
    setActiveSlotIndex(insertionIndex);
    setActiveSocketIndex(0);
  }

  function removeSlot(index: number) {
    setSlots((current) =>
      current.filter((_, slotIndex) => slotIndex !== index),
    );
    setActiveSlotIndex((current) => {
      if (current === null) {
        return null;
      }
      if (slots.length <= 1) {
        return null;
      }
      if (current > index) {
        return current - 1;
      }
      return Math.min(current, slots.length - 2);
    });
    setActiveSocketIndex(0);
  }

  function handleDrop(
    event: React.DragEvent<HTMLElement>,
    targetIndex: number,
  ) {
    event.preventDefault();
    setDragOverIndex(null);
    const payload = readDragPayload(event);
    if (!payload) {
      return;
    }
    if (payload.kind === "skill") {
      addSkill(payload.skillId, targetIndex);
    } else {
      moveSlot(payload.index, targetIndex);
    }
  }

  function selectSigil(sigilId: string | null) {
    if (
      activeSlotIndex === null ||
      !activeSkill ||
      !activeSocketType
    ) {
      return;
    }
    setSlots((current) =>
      current.map((slot, index) => {
        if (index !== activeSlotIndex) {
          return slot;
        }
        const sigilIds = Array.from(
          { length: activeSkill.socketTypes.length },
          (_, socketIndex) => slot.sigilIds[socketIndex] ?? null,
        );
        sigilIds[activeSocketIndex] = sigilId;
        return { ...slot, sigilIds };
      }),
    );
  }

  function toggleSlotCombo(index: number) {
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index
          ? { ...slot, comboEnabled: slot.comboEnabled !== true }
          : slot,
      ),
    );
    setError("");
  }

  function toggleSlotStance(index: number) {
    setSlots((current) => current.map((slot, slotIndex) =>
      slotIndex === index
        ? { ...slot, alternateEnabled: !slot.alternateEnabled }
        : slot
    ));
    setError("");
  }

  async function saveLoadout() {
    setIsSaving(true);
    setError("");
    try {
      const normalizedSlots = slots.map((slot) => {
        const skill = skillsById.get(slot.skillId);
        if (!skill) {
          return slot;
        }
        return {
          ...slot,
          sigilIds: skill.socketTypes.map((socketType, index) => {
            const sigil = sigils.find(
              (item) => item.id === slot.sigilIds[index],
            );
            return sigil?.category === socketType ? sigil.id : null;
          }),
        };
      });
      const saved = await gateway.save(
        character,
        setupType,
        normalizedSlots,
      );
      setSlots(saved.slots);
      setSavedSnapshot(serializeSlots(saved.slots));
      setUpdatedAt(saved.updatedAt);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить личный билд.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="player-build-panel" aria-labelledby="player-build-title">
      <nav className="player-build-setup-tabs" aria-label="Сетапы навыков">
        {playerBuildSetupTypes.map((item) => {
          const Icon = setupIcons[item];
          return (
            <button
              className={setupType === item ? "is-active" : ""}
              type="button"
              aria-pressed={setupType === item}
              key={item}
              onClick={() => setSetupType(item)}
            >
              <span>
                <Icon size={19} />
              </span>
              <small>Сетап</small>
              <strong>{playerBuildSetupLabels[item]}</strong>
            </button>
          );
        })}
      </nav>

      <header className="player-build-heading">
        <div>
          <span>Персональная сборка · {displayName}</span>
          <h2 id="player-build-title">
            {playerBuildSetupLabels[setupType]} · {character}
          </h2>
          <p>
            Перетащите до 10 навыков в слоты, расставьте их по порядку и
            установите подходящие сигилы.
          </p>
        </div>
        <div className="player-build-heading__actions">
          <span>
            <strong>{slots.length}</strong> / {PLAYER_BUILD_SLOT_LIMIT}
          </span>
          <button
            type="button"
            disabled={
              isLoading ||
              isSaving ||
              !isDirty ||
              hasUnavailableSkills
            }
            onClick={() => void saveLoadout()}
          >
            {isSaving ? (
              <span className="button-spinner" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Сохраняем…" : "Сохранить билд"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="player-build-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="player-build-status" aria-live="polite">
        {isLoading
          ? "Загружаем сохранённый билд…"
          : isDirty
            ? "Есть несохранённые изменения"
            : updatedAt
              ? "Билд сохранён"
              : "Новый билд"}
      </div>

      <div className="player-build-workspace">
        <section className="player-build-slots" aria-label="Слоты личного билда">
          <header>
            <div>
              <span>Боевой набор</span>
              <h3>10 слотов навыков</h3>
            </div>
            <small>Перетаскивайте для изменения порядка</small>
          </header>

          <div className="player-build-slot-grid">
            {Array.from(
              { length: PLAYER_BUILD_SLOT_LIMIT },
              (_, index) => {
                const slot = slots[index];
                const skill = slot
                  ? skillsById.get(slot.skillId) ?? null
                  : null;
                const useAlternate = Boolean(
                  slot?.alternateEnabled && skill?.alternateIconUrl,
                );
                const visibleIcon = useAlternate
                  ? skill?.alternateIconUrl ?? skill?.iconUrl
                  : skill?.iconUrl;
                const visibleName = useAlternate
                  ? skill?.alternateName ?? skill?.name
                  : skill?.name;
                return (
                  <article
                    className={[
                      "player-build-slot",
                      slot ? "is-filled" : "is-empty",
                      activeSlotIndex === index ? "is-active" : "",
                      dragOverIndex === index ? "is-drag-over" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    draggable={Boolean(slot)}
                    key={index}
                    onClick={() => {
                      if (slot) {
                        setActiveSlotIndex(index);
                        setActiveSocketIndex(0);
                      }
                    }}
                    onDragStart={(event) => {
                      if (slot) {
                        writeDragPayload(event, { kind: "slot", index });
                      }
                    }}
                    onDragEnd={() => setDragOverIndex(null)}
                    onDragEnter={() => setDragOverIndex(index)}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setDragOverIndex(null);
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = slot ? "move" : "copy";
                    }}
                    onDrop={(event) => handleDrop(event, index)}
                  >
                    <span className="player-build-slot__number">
                      {index + 1}
                    </span>
                    {skill ? (
                      <>
                        <span className="player-build-slot__drag" aria-hidden="true">
                          <GripVertical size={14} />
                        </span>
                        <button
                          className={[
                            "player-build-slot__icon",
                            skill.alternateIconUrl ? "can-flip" : "",
                            useAlternate ? "is-flipped" : "",
                          ].filter(Boolean).join(" ")}
                          type="button"
                          disabled={!skill.alternateIconUrl}
                          aria-pressed={useAlternate}
                          aria-label={skill.alternateIconUrl ? `Сменить стойку навыка ${visibleName}` : undefined}
                          title={skill.alternateIconUrl ? "Сменить стойку" : undefined}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSlotStance(index);
                          }}
                        >
                          <Image
                            src={visibleIcon ?? skill.iconUrl}
                            alt=""
                            width={82}
                            height={82}
                            unoptimized
                          />
                        </button>
                        <strong title={visibleName}>{visibleName}</strong>
                        <small>
                          {skill.socketTypes.length
                            ? `${skill.socketTypes.filter((socketType, socketIndex) => sigils.some((sigil) => sigil.id === slot.sigilIds[socketIndex] && sigil.category === socketType)).length} / ${skill.socketTypes.length} сигилов`
                            : "Без сокетов"}
                        </small>
                        {skill.comboAvailable ? (
                          <button
                            className={[
                              "player-build-slot__combo",
                              slot.comboEnabled
                                ? "is-enabled"
                                : "is-disabled",
                            ].join(" ")}
                            type="button"
                            aria-pressed={slot.comboEnabled === true}
                            aria-label={`${slot.comboEnabled ? "Выключить" : "Включить"} комбо для навыка ${skill.name}`}
                            title={
                              slot.comboEnabled
                                ? "Комбо включено"
                                : "Комбо выключено"
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSlotCombo(index);
                            }}
                          >
                            <Image
                              src={
                                slot.comboEnabled
                                  ? "/combo-build-on.webp"
                                  : "/combo-build-off.webp"
                              }
                              alt=""
                              width={44}
                              height={44}
                              unoptimized
                            />
                          </button>
                        ) : null}
                        <button
                          className="player-build-slot__remove"
                          type="button"
                          aria-label={`Убрать навык ${skill.name}`}
                          title="Убрать навык"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeSlot(index);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : slot ? (
                      <>
                        <span className="player-build-slot__missing">!</span>
                        <strong>Навык недоступен</strong>
                        <small>Удалите его и выберите другой</small>
                        <button
                          className="player-build-slot__remove"
                          type="button"
                          aria-label="Убрать недоступный навык"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeSlot(index);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="player-build-slot__empty-mark">
                          <Plus size={22} />
                        </span>
                        <strong>Пустой слот</strong>
                        <small>Перетащите навык сюда</small>
                      </>
                    )}
                  </article>
                );
              },
            )}
          </div>
        </section>

        <section
          className="player-build-socket-editor"
          aria-labelledby="player-build-sockets-title"
        >
          <header>
            <span>
              <Gem size={17} />
            </span>
            <div>
              <small>Усиления выбранного навыка</small>
              <h3 id="player-build-sockets-title">Сигилы</h3>
            </div>
          </header>

          {!activeSkill || !activeSlot ? (
            <div className="player-build-socket-empty">
              <Gem size={28} />
              <strong>Выберите навык в слоте</strong>
              <p>Здесь появятся его сокеты и совместимые сигилы.</p>
            </div>
          ) : activeSkill.socketTypes.length === 0 ? (
            <div className="player-build-socket-empty">
              <Check size={28} />
              <strong>{activeSkill.name}</strong>
              <p>У этого навыка нет сокетов для сигилов.</p>
            </div>
          ) : (
            <>
              <div className="player-build-socket-skill">
                <Image
                  src={activeSkill.iconUrl}
                  alt=""
                  width={52}
                  height={52}
                  unoptimized
                />
                <div>
                  <small>Навык {activeSlotIndex! + 1}</small>
                  <strong>{activeSkill.name}</strong>
                </div>
              </div>

              <div className="player-build-socket-tabs">
                {activeSkill.socketTypes.map((socketType, index) => {
                  const selectedSigil = sigils.find(
                    (sigil) =>
                      sigil.id === activeSlot.sigilIds[index],
                  );
                  return (
                    <button
                      className={[
                        index === activeSocketIndex ? "is-active" : "",
                        selectedSigil ? "is-filled" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      type="button"
                      key={`${socketType}-${index}`}
                      onClick={() => setActiveSocketIndex(index)}
                    >
                      {selectedSigil ? (
                        <Image
                          src={selectedSigil.iconUrl}
                          alt=""
                          width={45}
                          height={45}
                          unoptimized
                        />
                      ) : (
                        <SigilSocketIcon
                          category={socketType}
                          size="large"
                        />
                      )}
                      <span>
                        <small>Сокет {index + 1}</small>
                        <strong>
                          {selectedSigil?.name ?? socketType}
                        </strong>
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeSocketType ? (
                <div className="player-build-sigil-picker">
                  <header>
                    <div>
                      <small>Подходящий тип</small>
                      <strong>{activeSocketType}</strong>
                    </div>
                    {activeSlot.sigilIds[activeSocketIndex] ? (
                      <button
                        type="button"
                        onClick={() => selectSigil(null)}
                      >
                        Очистить сокет
                      </button>
                    ) : null}
                  </header>
                  {matchingSigils.length === 0 ? (
                    <p>
                      Администратор пока не добавил сигилы категории
                      «{activeSocketType}».
                    </p>
                  ) : (
                    <div>
                      {matchingSigils.map((sigil) => {
                        const isSelected =
                          activeSlot.sigilIds[activeSocketIndex] ===
                          sigil.id;
                        return (
                          <button
                            className={isSelected ? "is-selected" : ""}
                            type="button"
                            key={sigil.id}
                            onClick={() => selectSigil(sigil.id)}
                          >
                            <Image
                              src={sigil.iconUrl}
                              alt=""
                              width={48}
                              height={48}
                              unoptimized
                            />
                            <span>
                              <strong>{sigil.name}</strong>
                              <small>{sigil.description}</small>
                            </span>
                            {isSelected ? <Check size={15} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="player-build-skill-library">
        <header>
          <div>
            <span>Библиотека персонажа</span>
            <h3>Доступные навыки</h3>
          </div>
          <small>
            {availableSkills.length} из {skills.length} доступны
          </small>
        </header>

        {isSkillsLoading ? (
          <div className="player-build-library-empty">
            <span className="boot-screen__spinner" />
            <p>Загружаем навыки персонажа…</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="player-build-library-empty">
            <p>Администратор пока не заполнил навыки этого персонажа.</p>
          </div>
        ) : availableSkills.length === 0 ? (
          <div className="player-build-library-empty">
            <Check size={23} />
            <p>Все доступные навыки уже находятся в вашем билде.</p>
          </div>
        ) : (
          <div className="player-build-skill-grid">
            {availableSkills.map((skill) => (
              <article
                draggable={slots.length < PLAYER_BUILD_SLOT_LIMIT}
                key={skill.id}
                onDragStart={(event) =>
                  writeDragPayload(event, {
                    kind: "skill",
                    skillId: skill.id,
                  })
                }
              >
                <span className="player-build-skill-grid__icon">
                  <Image
                    src={skill.iconUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                  />
                </span>
                <div>
                  <small>
                    {skill.slotType === "rabam"
                      ? `Рабам ${skill.slotIndex}`
                      : `Навык ${skill.slotIndex}`}
                  </small>
                  <strong>{skill.name}</strong>
                  <span>
                    {skill.socketTypes.length
                      ? `${skill.socketTypes.length} сокета`
                      : "Без сокетов"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={slots.length >= PLAYER_BUILD_SLOT_LIMIT}
                  aria-label={`Добавить навык ${skill.name}`}
                  onClick={() => addSkill(skill.id)}
                >
                  <Plus size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
