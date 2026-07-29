"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  ImagePlus,
  LogOut,
  PencilLine,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import {
  HttpBuildGateway,
  HttpBuildSkillGateway,
} from "@/app/lib/build-client";
import { guildRoleLabels } from "@/app/lib/role-labels";
import {
  buildCharacterClasses,
  type BuildCharacterClass,
  type BuildCharacterSlot,
  type BuildProfile,
  type BuildSkill,
} from "@/domain/build/model";
import { canManageBuildSkills } from "@/domain/build/permissions";
import { BrandMark } from "../brand-mark";
import { SkillDescriptionEditor } from "./skill-description-editor";

const gateway = new HttpBuildGateway();
const skillGateway = new HttpBuildSkillGateway();

const emptyProfile: BuildProfile = {
  mainCharacter: null,
  mirrorCharacter: null,
  updatedAt: null,
};

export function BuildPortal() {
  const auth = useAuthController();
  const [character, setCharacter] = useState<BuildCharacterSlot>("main");
  const [profile, setProfile] = useState<BuildProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlot, setSavingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [selectingSlot, setSelectingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<BuildSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillIcon, setSkillIcon] = useState<File | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<BuildSkill | null>(null);
  const skillFormRef = useRef<HTMLFormElement>(null);
  const selectedCharacter =
    character === "main" ? profile.mainCharacter : profile.mirrorCharacter;

  useEffect(() => {
    if (!auth.isBooting && !auth.user) {
      window.location.replace("/");
    }
  }, [auth.isBooting, auth.user]);

  useEffect(() => {
    if (!auth.user) {
      return;
    }

    const controller = new AbortController();
    gateway
      .get(controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setError("");
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить персонажей.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [auth.user]);

  useEffect(() => {
    if (!selectingSlot) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingSlot) {
        setSelectingSlot(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [savingSlot, selectingSlot]);

  useEffect(() => {
    if (!auth.user || !selectedCharacter) {
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setIsLoadingSkills(true);
        setSkillError("");
      }
    });
    skillGateway
      .list(selectedCharacter, controller.signal)
      .then(setSkills)
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setSkillError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить умения.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSkills(false);
        }
      });

    return () => controller.abort();
  }, [auth.user, selectedCharacter]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return query
      ? buildCharacterClasses.filter((name) =>
          name.toLocaleLowerCase("ru").includes(query),
        )
      : buildCharacterClasses;
  }, [search]);

  if (auth.isBooting || !auth.user) {
    return (
      <main className="boot-screen" aria-live="polite">
        <BrandMark />
        <span className="boot-screen__spinner" />
        <p>
          {auth.isBooting
            ? "Проверяем доступ к билду…"
            : "Возвращаем к авторизации…"}
        </p>
      </main>
    );
  }

  const user = auth.user;
  const isMain = character === "main";
  const canManageSkills = canManageBuildSkills(user.role);

  function openCharacterPicker(slot: BuildCharacterSlot) {
    setCharacter(slot);
    setSelectingSlot(slot);
    setSearch("");
    setError("");
  }

  async function selectCharacter(nextCharacter: BuildCharacterClass) {
    if (!selectingSlot) {
      return;
    }

    const slot = selectingSlot;
    setSavingSlot(slot);
    setError("");
    try {
      setProfile(await gateway.setCharacter(slot, nextCharacter));
      setSelectingSlot(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить персонажа.",
      );
    } finally {
      setSavingSlot(null);
    }
  }

  function resetSkillEditor(form = skillFormRef.current) {
    form?.reset();
    setEditingSkill(null);
    setSkillName("");
    setSkillDescription("");
    setSkillIcon(null);
    setEditorKey((current) => current + 1);
  }

  function startEditingSkill(skill: BuildSkill) {
    skillFormRef.current?.reset();
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillDescription(skill.descriptionHtml);
    setSkillIcon(null);
    setSkillError("");
    setEditorKey((current) => current + 1);
    requestAnimationFrame(() => {
      document
        .getElementById("build-skill-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function saveSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!selectedCharacter || (!editingSkill && !skillIcon)) {
      setSkillError(
        editingSkill
          ? "Заполните название и описание умения."
          : "Заполните название, описание и добавьте иконку умения.",
      );
      return;
    }

    setIsCreatingSkill(true);
    setSkillError("");
    try {
      const formData = new FormData();
      formData.set("character", selectedCharacter);
      formData.set("name", skillName);
      formData.set("descriptionHtml", skillDescription);
      if (skillIcon) {
        formData.set("icon", skillIcon);
      }

      if (editingSkill) {
        const updated = await skillGateway.update(editingSkill.id, formData);
        setSkills((current) =>
          current.map((skill) =>
            skill.id === updated.id ? updated : skill,
          ),
        );
      } else {
        const created = await skillGateway.create(formData);
        setSkills((current) => [...current, created]);
      }
      resetSkillEditor(form);
    } catch (caught) {
      setSkillError(
        caught instanceof Error
          ? caught.message
          : editingSkill
            ? "Не удалось изменить умение."
            : "Не удалось добавить умение.",
      );
    } finally {
      setIsCreatingSkill(false);
    }
  }

  async function deleteSkill(id: string) {
    setDeletingSkillId(id);
    setSkillError("");
    try {
      await skillGateway.delete(id);
      setSkills((current) => current.filter((skill) => skill.id !== id));
      if (editingSkill?.id === id) {
        resetSkillEditor();
      }
    } catch (caught) {
      setSkillError(
        caught instanceof Error
          ? caught.message
          : "Не удалось удалить умение.",
      );
    } finally {
      setDeletingSkillId(null);
    }
  }

  return (
    <div className="build-shell">
      <header className="dashboard-header build-header">
        <Link
          className="build-brand-link"
          href="/"
          aria-label="Вернуться в штаб"
        >
          <BrandMark compact />
        </Link>
        <nav aria-label="Основная навигация">
          <Link href="/">Обзор</Link>
          <Link href="/#planner">Мой план</Link>
          <Link href="/#members">Состав</Link>
          <Link href="/#events">События</Link>
          <Link className="is-current" href="/build">
            Билд
          </Link>
        </nav>
        <div className="dashboard-header__actions">
          <Link
            className="icon-button"
            href="/"
            aria-label="Вернуться в штаб"
            title="Вернуться в штаб"
          >
            <ArrowLeft size={17} />
          </Link>
          <span className="profile-chip build-profile-static">
            <span className="profile-avatar">
              {user.discord?.avatarUrl ? (
                <Image
                  src={user.discord.avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                />
              ) : (
                user.displayName.slice(0, 1).toLocaleUpperCase("ru")
              )}
            </span>
            <span className="profile-chip__copy">
              <strong>{user.displayName}</strong>
              <small>{guildRoleLabels[user.role]}</small>
            </span>
          </span>
          <button
            className="icon-button logout-button"
            type="button"
            aria-label="Выйти из аккаунта"
            title="Выйти из аккаунта"
            onClick={auth.logout}
            disabled={auth.isSubmitting}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="build-main">
        <section className="build-hero" aria-labelledby="build-title">
          <div className="build-hero__copy">
            <span className="section-kicker">
              <Shield size={15} /> Персонажи
            </span>
            <h1 id="build-title">Билд</h1>
          </div>
          <span className="build-hero__status">
            {isMain ? "Основной герой" : "Зеркало"}
          </span>
        </section>

        <section className="build-character-stage">
          <article
            className="build-character-card"
            aria-live="polite"
            aria-labelledby="build-character-title"
          >
            <span className="build-character-card__mark" aria-hidden="true">
              {isMain ? (
                <UserRound size={42} />
              ) : (
                <Copy size={42} />
              )}
            </span>
            <div>
              <small>{isMain ? "Основной герой" : "Зеркало"}</small>
              <h2 id="build-character-title">
                {isLoading
                  ? "Загружаем…"
                  : selectedCharacter ?? "Герой не выбран"}
              </h2>
              <button
                className="build-character-card__select"
                type="button"
                onClick={() => openCharacterPicker(character)}
                disabled={isLoading || savingSlot !== null}
              >
                {selectedCharacter ? (
                  <PencilLine size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {selectedCharacter ? "Изменить героя" : "Добавить героя"}
              </button>
            </div>
          </article>

          <aside
            className="build-character-switcher"
            aria-label="Выбор персонажа"
          >
            <span>Персонажи</span>
            <button
              className={isMain ? "is-active" : ""}
              type="button"
              aria-pressed={isMain}
              aria-label={`Основной герой: ${profile.mainCharacter ?? "не выбран"}`}
              onClick={() => setCharacter("main")}
            >
              <UserRound size={20} />
              <span>
                <small>Основной герой</small>
                <strong>{profile.mainCharacter ?? "Добавить героя"}</strong>
              </span>
            </button>
            <button
              className={!isMain ? "is-active" : ""}
              type="button"
              aria-pressed={!isMain}
              aria-label={`Зеркало: ${profile.mirrorCharacter ?? "не выбрано"}`}
              onClick={() => setCharacter("mirror")}
            >
              <Copy size={20} />
              <span>
                <small>Зеркало</small>
                <strong>{profile.mirrorCharacter ?? "Добавить героя"}</strong>
              </span>
            </button>
            {error ? (
              <p className="build-page-error" role="alert">
                {error}
              </p>
            ) : null}
          </aside>
        </section>

        {selectedCharacter ? (
          <section
            className="build-skills-section"
            aria-labelledby="build-skills-title"
          >
            <header className="build-skills-heading">
              <div>
                <span className="section-kicker">
                  <BookOpen size={15} /> Библиотека класса
                </span>
                <h2 id="build-skills-title">Умения: {selectedCharacter}</h2>
                <p>
                  Общие умения видны всем участникам гильдии, выбравшим этого
                  героя.
                </p>
              </div>
              <span>{skills.length} умений</span>
            </header>

            {canManageSkills ? (
              <form
                ref={skillFormRef}
                id="build-skill-editor"
                className="build-skill-editor"
                onSubmit={(event) => void saveSkill(event)}
              >
                <div className="build-skill-editor__heading">
                  <span>
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <small>Только для администраторов</small>
                    <h3>
                      {editingSkill
                        ? `Редактирование: ${editingSkill.name}`
                        : "Редактор умений"}
                    </h3>
                  </div>
                </div>

                <div className="build-skill-editor__fields">
                  <label className="build-skill-name-field">
                    <span>Название умения</span>
                    <input
                      type="text"
                      value={skillName}
                      maxLength={80}
                      required
                      disabled={isCreatingSkill}
                      placeholder="Например: Ур. 13 Волна тьмы"
                      onChange={(event) => setSkillName(event.target.value)}
                    />
                  </label>

                  <label className="build-skill-icon-field">
                    <span className="build-skill-icon-field__mark">
                      <ImagePlus size={19} />
                    </span>
                    <span>
                      <strong>
                        {skillIcon
                          ? skillIcon.name
                          : editingSkill
                            ? "Заменить иконку (необязательно)"
                            : "Добавить иконку умения"}
                      </strong>
                      <small>PNG, JPG или WEBP · до 2 МБ</small>
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      required={!editingSkill}
                      disabled={isCreatingSkill}
                      onChange={(event) =>
                        setSkillIcon(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>

                <div className="build-skill-description-field">
                  <span>Описание умения</span>
                  <SkillDescriptionEditor
                    key={editorKey}
                    initialHtml={editingSkill?.descriptionHtml ?? ""}
                    disabled={isCreatingSkill}
                    onChange={setSkillDescription}
                  />
                </div>

                <footer>
                  <p>
                    Выделите нужный участок текста, затем выберите цвет или
                    формат. Списки создаются отдельными кнопками.
                  </p>
                  <span className="build-skill-editor__actions">
                    {editingSkill ? (
                      <button
                        className="is-secondary"
                        type="button"
                        disabled={isCreatingSkill}
                        onClick={() => resetSkillEditor()}
                      >
                        <X size={15} />
                        Отмена
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={
                        isCreatingSkill ||
                        (!editingSkill && !skillIcon) ||
                        !skillName.trim() ||
                        !skillDescription.trim()
                      }
                    >
                      {editingSkill ? (
                        <PencilLine size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                      {isCreatingSkill
                        ? "Сохраняем…"
                        : editingSkill
                          ? "Сохранить изменения"
                          : "Добавить для всех"}
                    </button>
                  </span>
                </footer>
              </form>
            ) : null}

            {skillError ? (
              <p className="build-page-error" role="alert">
                {skillError}
              </p>
            ) : null}

            <div
              className="build-skill-catalog"
              aria-live="polite"
              aria-busy={isLoadingSkills}
            >
              {isLoadingSkills ? (
                <div className="build-skill-empty">
                  <span className="boot-screen__spinner" />
                  <p>Загружаем умения класса…</p>
                </div>
              ) : skills.length === 0 ? (
                <div className="build-skill-empty">
                  <BookOpen size={28} />
                  <h3>Умения пока не добавлены</h3>
                  <p>
                    {canManageSkills
                      ? "Создайте первое умение в редакторе выше."
                      : "Администратор скоро заполнит библиотеку этого класса."}
                  </p>
                </div>
              ) : (
                skills.map((skill) => (
                  <article className="build-skill-card" key={skill.id}>
                    <Image
                      className="build-skill-card__icon"
                      src={skill.iconUrl}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                    />
                    <div className="build-skill-card__content">
                      <header>
                        <h3>{skill.name}</h3>
                        {canManageSkills ? (
                          <span className="build-skill-card__actions">
                            <button
                              type="button"
                              title="Редактировать умение"
                              aria-label={`Редактировать умение ${skill.name}`}
                              disabled={
                                deletingSkillId !== null || isCreatingSkill
                              }
                              onClick={() => startEditingSkill(skill)}
                            >
                              <PencilLine size={15} />
                            </button>
                            <button
                              className="is-delete"
                              type="button"
                              title="Удалить умение"
                              aria-label={`Удалить умение ${skill.name}`}
                              disabled={
                                deletingSkillId !== null || isCreatingSkill
                              }
                              onClick={() => void deleteSkill(skill.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </span>
                        ) : null}
                      </header>
                      <div
                        className="build-skill-card__description"
                        dangerouslySetInnerHTML={{
                          __html: skill.descriptionHtml,
                        }}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </main>

      {selectingSlot ? (
        <div
          className="build-picker-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingSlot) {
              setSelectingSlot(null);
            }
          }}
        >
          <section
            className="build-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="build-picker-title"
          >
            <header>
              <div>
                <span>
                  {selectingSlot === "main"
                    ? "Основной герой"
                    : "Зеркало"}
                </span>
                <h2 id="build-picker-title">Выберите персонажа</h2>
              </div>
              <button
                type="button"
                aria-label="Закрыть выбор персонажа"
                onClick={() => setSelectingSlot(null)}
                disabled={savingSlot !== null}
              >
                <X size={18} />
              </button>
            </header>

            <label className="build-picker-search">
              <Search size={17} />
              <span className="sr-only">Найти персонажа</span>
              <input
                autoFocus
                type="search"
                value={search}
                placeholder="Найти персонажа…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="build-picker-grid">
              {filteredClasses.map((name) => {
                const isSelected =
                  (selectingSlot === "main"
                    ? profile.mainCharacter
                    : profile.mirrorCharacter) === name;
                return (
                  <button
                    className={isSelected ? "is-selected" : ""}
                    type="button"
                    key={name}
                    disabled={savingSlot !== null}
                    onClick={() => void selectCharacter(name)}
                  >
                    <span>{name}</span>
                    {isSelected ? <Check size={15} /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
