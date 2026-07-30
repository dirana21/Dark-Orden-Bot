"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Crown,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Swords,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  HttpBuildSkillGateway,
  HttpPlayerBuildGateway,
} from "@/app/lib/build-client";
import { guildRoleLabels } from "@/app/lib/role-labels";
import type { GuildRole } from "@/domain/auth/model";
import type {
  BuildCharacter,
  BuildSkill,
} from "@/domain/build/model";
import {
  PLAYER_BUILD_SLOT_LIMIT,
  playerBuildSetupLabels,
  playerBuildSetupTypes,
  type CommunityBuildAuthor,
  type PlayerBuildLoadout,
  type PlayerBuildSetupType,
} from "@/domain/build/player-build-model";
import type { BuildSigil } from "@/domain/build/sigil-model";
import { SigilSocketIcon } from "./sigil-socket-icon";

const gateway = new HttpPlayerBuildGateway();
const skillGateway = new HttpBuildSkillGateway();
const setupIcons = {
  "mass-pvp": UsersRound,
  pvp: Swords,
  pve: Sprout,
  bosses: Crown,
} satisfies Record<PlayerBuildSetupType, typeof Swords>;

interface CommunityBuildsPanelProps {
  characters: BuildCharacter[];
  sigils: BuildSigil[];
}

export function CommunityBuildsPanel({
  characters,
  sigils,
}: CommunityBuildsPanelProps) {
  const [authors, setAuthors] = useState<CommunityBuildAuthor[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(
    null,
  );
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null,
  );
  const [selectedSetup, setSelectedSetup] =
    useState<PlayerBuildSetupType>("mass-pvp");
  const [skills, setSkills] = useState<BuildSkill[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [error, setError] = useState("");
  const [inspectedSkill, setInspectedSkill] = useState<{
    skill: BuildSkill;
    comboEnabled: boolean | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .listCommunity(controller.signal)
      .then((items) => {
        setAuthors(items);
        const firstAuthor = items[0];
        const firstLoadout = firstAuthor?.loadouts[0];
        setSelectedAuthorId(firstAuthor?.id ?? null);
        setSelectedCharacter(firstLoadout?.character ?? null);
        setSelectedSetup(firstLoadout?.setupType ?? "mass-pvp");
        setError("");
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить билды игроков.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCharacter) {
      return;
    }
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) {
          return null;
        }
        setIsLoadingSkills(true);
        return skillGateway.list(selectedCharacter, controller.signal);
      })
      .then((items) => {
        if (items) {
          setSkills(items);
        }
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить навыки этого билда.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSkills(false);
        }
      });

    return () => controller.abort();
  }, [selectedCharacter]);

  useEffect(() => {
    if (!inspectedSkill) {
      return;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setInspectedSkill(null);
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [inspectedSkill]);

  const filteredAuthors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    if (!query) {
      return authors;
    }
    return authors.filter(
      (author) =>
        author.displayName.toLocaleLowerCase("ru").includes(query) ||
        author.loadouts.some((loadout) =>
          loadout.character.toLocaleLowerCase("ru").includes(query),
        ),
    );
  }, [authors, search]);

  const selectedAuthor =
    authors.find((author) => author.id === selectedAuthorId) ?? null;
  const authorCharacters = selectedAuthor
    ? [...new Set(selectedAuthor.loadouts.map((item) => item.character))]
    : [];
  const characterLoadouts = selectedAuthor?.loadouts.filter(
    (item) => item.character === selectedCharacter,
  ) ?? [];
  const activeLoadout =
    characterLoadouts.find((item) => item.setupType === selectedSetup) ??
    characterLoadouts[0] ??
    null;
  const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
  const characterEntry = characters.find(
    (item) => item.name === selectedCharacter,
  );

  function selectAuthor(author: CommunityBuildAuthor) {
    const firstLoadout = author.loadouts[0];
    setSelectedAuthorId(author.id);
    setSelectedCharacter(firstLoadout?.character ?? null);
    setSelectedSetup(firstLoadout?.setupType ?? "mass-pvp");
  }

  function selectCharacter(character: string) {
    const firstLoadout = selectedAuthor?.loadouts.find(
      (item) => item.character === character,
    );
    setSelectedCharacter(character);
    setSelectedSetup(firstLoadout?.setupType ?? "mass-pvp");
  }

  function renderSetupButton(
    setupType: PlayerBuildSetupType,
    loadout: PlayerBuildLoadout | undefined,
  ) {
    const Icon = setupIcons[setupType];
    return (
      <button
        className={
          activeLoadout?.setupType === setupType ? "is-active" : ""
        }
        type="button"
        disabled={!loadout}
        key={setupType}
        onClick={() => setSelectedSetup(setupType)}
      >
        <Icon size={17} />
        <span>
          <strong>{playerBuildSetupLabels[setupType]}</strong>
          <small>
            {loadout ? `${loadout.slots.length} навыков` : "Не создан"}
          </small>
        </span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <section className="community-builds-empty">
        <span className="boot-screen__spinner" />
        <h2>Загружаем билды игроков…</h2>
      </section>
    );
  }

  if (error && authors.length === 0) {
    return (
      <section className="community-builds-empty">
        <ShieldCheck size={28} />
        <h2>Не удалось открыть билды</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (authors.length === 0) {
    return (
      <section className="community-builds-empty">
        <Sparkles size={30} />
        <h2>Пока нет опубликованных билдов</h2>
        <p>
          Соберите хотя бы один непустой сетап во вкладке «Мои билды» —
          он появится здесь для всей гильдии.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="community-builds-panel">
      <header className="community-builds-heading">
        <div>
          <span>Опыт участников гильдии</span>
          <h2>Билды игроков</h2>
          <p>
            Выберите автора, затем персонажа и нужный боевой сетап.
          </p>
        </div>
        <label>
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Ник или персонаж"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </header>

      {error ? (
        <p className="player-build-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="community-builds-layout">
        <aside className="community-build-authors" aria-label="Авторы билдов">
          <header>
            <span>Игроки</span>
            <strong>{filteredAuthors.length}</strong>
          </header>
          <div>
            {filteredAuthors.map((author) => {
              const characterCount = new Set(
                author.loadouts.map((item) => item.character),
              ).size;
              return (
                <button
                  className={
                    selectedAuthorId === author.id ? "is-active" : ""
                  }
                  type="button"
                  key={author.id}
                  onClick={() => selectAuthor(author)}
                >
                  <span className="community-build-avatar">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt=""
                        width={52}
                        height={52}
                        unoptimized
                      />
                    ) : (
                      author.displayName.slice(0, 1).toLocaleUpperCase("ru")
                    )}
                  </span>
                  <span>
                    <strong>{author.displayName}</strong>
                    <small>
                      {characterCount} персонаж
                      {characterCount === 1 ? "" : "а"} ·{" "}
                      {author.loadouts.length} сетапа
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {selectedAuthor ? (
          <div className="community-build-profile">
            <header className="community-player-profile">
              {characterEntry?.imageUrl ? (
                <Image
                  className="community-player-profile__background"
                  src={characterEntry.imageUrl}
                  alt=""
                  width={900}
                  height={300}
                  unoptimized
                />
              ) : null}
              <div className="community-player-profile__shade" />
              <span className="community-build-avatar is-large">
                {selectedAuthor.avatarUrl ? (
                  <Image
                    src={selectedAuthor.avatarUrl}
                    alt=""
                    width={76}
                    height={76}
                    unoptimized
                  />
                ) : (
                  selectedAuthor.displayName
                    .slice(0, 1)
                    .toLocaleUpperCase("ru")
                )}
              </span>
              <div>
                <small>Профиль игрока</small>
                <h2>{selectedAuthor.displayName}</h2>
                <p>
                  {guildRoleLabels[
                    selectedAuthor.role as GuildRole
                  ] ?? "Участник"}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Основной герой</dt>
                  <dd>{selectedAuthor.mainCharacter ?? "Не выбран"}</dd>
                </div>
                <div>
                  <dt>Зеркало</dt>
                  <dd>{selectedAuthor.mirrorCharacter ?? "Не выбрано"}</dd>
                </div>
              </dl>
            </header>

            <nav
              className="community-build-character-tabs"
              aria-label="Персонажи игрока"
            >
              {authorCharacters.map((character) => (
                <button
                  className={
                    character === selectedCharacter ? "is-active" : ""
                  }
                  type="button"
                  key={character}
                  onClick={() => selectCharacter(character)}
                >
                  <UserRound size={15} />
                  {character}
                  <small>
                    {
                      selectedAuthor.loadouts.filter(
                        (item) => item.character === character,
                      ).length
                    }{" "}
                    / 4
                  </small>
                </button>
              ))}
            </nav>

            <nav
              className="community-build-setup-tabs"
              aria-label="Сетапы игрока"
            >
              {playerBuildSetupTypes.map((setupType) =>
                renderSetupButton(
                  setupType,
                  characterLoadouts.find(
                    (item) => item.setupType === setupType,
                  ),
                ),
              )}
            </nav>

            {activeLoadout ? (
              <section className="community-build-viewer">
                <header>
                  <div>
                    <span>{activeLoadout.character}</span>
                    <h3>
                      {playerBuildSetupLabels[activeLoadout.setupType]}
                    </h3>
                  </div>
                  <small>
                    {activeLoadout.slots.length} / {PLAYER_BUILD_SLOT_LIMIT}{" "}
                    навыков
                  </small>
                </header>

                {isLoadingSkills ? (
                  <div className="community-build-loading">
                    <span className="boot-screen__spinner" />
                  </div>
                ) : (
                  <div className="community-build-slot-grid">
                    {Array.from(
                      { length: PLAYER_BUILD_SLOT_LIMIT },
                      (_, index) => {
                        const slot = activeLoadout.slots[index];
                        const skill = slot
                          ? skillsById.get(slot.skillId)
                          : null;
                        return (
                          <article
                            className={
                              skill
                                ? "is-filled is-clickable"
                                : "is-empty"
                            }
                            key={index}
                            role={skill ? "button" : undefined}
                            tabIndex={skill ? 0 : undefined}
                            onClick={() => {
                              if (skill) {
                                setInspectedSkill({
                                  skill,
                                  comboEnabled: slot.comboEnabled,
                                });
                              }
                            }}
                            onKeyDown={(event) => {
                              if (
                                skill &&
                                (event.key === "Enter" ||
                                  event.key === " ")
                              ) {
                                event.preventDefault();
                                setInspectedSkill({
                                  skill,
                                  comboEnabled: slot.comboEnabled,
                                });
                              }
                            }}
                          >
                            <span className="community-build-slot__number">
                              {index + 1}
                            </span>
                            {skill ? (
                              <>
                                <Image
                                  src={skill.iconUrl}
                                  alt=""
                                  width={72}
                                  height={72}
                                  unoptimized
                                />
                                <strong title={skill.name}>
                                  {skill.name}
                                </strong>
                                {skill.comboAvailable ? (
                                  <Image
                                    className="community-build-slot__combo"
                                    src={
                                      slot.comboEnabled
                                        ? "/combo-build-on.webp"
                                        : "/combo-build-off.webp"
                                    }
                                    alt={
                                      slot.comboEnabled
                                        ? "Комбо включено"
                                        : "Комбо выключено"
                                    }
                                    title={
                                      slot.comboEnabled
                                        ? "Комбо включено"
                                        : "Комбо выключено"
                                    }
                                    width={34}
                                    height={34}
                                    unoptimized
                                  />
                                ) : null}
                                <div>
                                  {skill.socketTypes.map(
                                    (socketType, socketIndex) => {
                                      const selectedSigil = sigils.find(
                                        (sigil) =>
                                          sigil.id ===
                                          slot.sigilIds[socketIndex],
                                      );
                                      return selectedSigil ? (
                                        <Image
                                          src={selectedSigil.iconUrl}
                                          alt={selectedSigil.name}
                                          title={selectedSigil.name}
                                          width={28}
                                          height={28}
                                          key={`${socketType}-${socketIndex}`}
                                          unoptimized
                                        />
                                      ) : (
                                        <SigilSocketIcon
                                          category={socketType}
                                          key={`${socketType}-${socketIndex}`}
                                        />
                                      );
                                    },
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="community-build-slot__empty">
                                  {index + 1}
                                </span>
                                <small>Пусто</small>
                              </>
                            )}
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
      </section>

      {inspectedSkill ? (
        <div
          className="community-skill-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setInspectedSkill(null);
            }
          }}
        >
          <section
            className="community-skill-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-skill-title"
          >
            <header>
              <Image
                src={inspectedSkill.skill.iconUrl}
                alt=""
                width={72}
                height={72}
                unoptimized
              />
              <div>
                <small>Описание навыка</small>
                <h2 id="community-skill-title">
                  {inspectedSkill.skill.name}
                </h2>
              </div>
              {inspectedSkill.skill.comboAvailable ? (
                <span className="community-skill-dialog__combo">
                  <Image
                    src={
                      inspectedSkill.comboEnabled
                        ? "/combo-build-on.webp"
                        : "/combo-build-off.webp"
                    }
                    alt=""
                    width={54}
                    height={54}
                    unoptimized
                  />
                  <small>
                    {inspectedSkill.comboEnabled
                      ? "Комбо включено"
                      : "Комбо выключено"}
                  </small>
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Закрыть описание"
                onClick={() => setInspectedSkill(null)}
              >
                <X size={18} />
              </button>
            </header>
            <div
              className="community-skill-dialog__description build-skill-card__description"
              dangerouslySetInnerHTML={{
                __html: inspectedSkill.skill.descriptionHtml,
              }}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
