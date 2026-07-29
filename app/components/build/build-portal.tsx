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
import dynamic from "next/dynamic";
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
  UsersRound,
  X,
} from "lucide-react";
import { useAuthController } from "@/app/hooks/use-auth-controller";
import {
  HttpBuildGateway,
  HttpBuildSkillGateway,
} from "@/app/lib/build-client";
import { optimizeImageUpload } from "@/app/lib/image-upload";
import { guildRoleLabels } from "@/app/lib/role-labels";
import {
  buildSkillSlotLimits,
  isSocketlessBuildSkillSlot,
  type BuildCharacter,
  type BuildCharacterClass,
  type BuildCharacterSlot,
  type BuildProfile,
  type BuildSkill,
  type BuildSkillSlotType,
} from "@/domain/build/model";
import { canManageBuildSkills } from "@/domain/build/permissions";
import {
  buildSigilCategories,
  type BuildSigil,
  type BuildSigilCategory,
} from "@/domain/build/sigil-model";
import { BrandMark } from "../brand-mark";
import { MobileSiteNav } from "../mobile-site-nav";
import { SigilPanel } from "./sigil-panel";
import { SigilSocketIcon } from "./sigil-socket-icon";

const SkillDescriptionEditor = dynamic(() =>
  import("./skill-description-editor").then(
    (module) => module.SkillDescriptionEditor,
  ),
);
const PersonalBuildWorkspace = dynamic(() =>
  import("./personal-build-workspace").then(
    (module) => module.PersonalBuildWorkspace,
  ),
);
const CommunityBuildsPanel = dynamic(() =>
  import("./community-builds-panel").then(
    (module) => module.CommunityBuildsPanel,
  ),
);

const gateway = new HttpBuildGateway();
const skillGateway = new HttpBuildSkillGateway();
const configurableBuildSigilCategories = buildSigilCategories.filter(
  (category) => category !== "Категория",
);

const emptyProfile: BuildProfile = {
  mainCharacter: null,
  mirrorCharacter: null,
  updatedAt: null,
};

export function BuildPortal() {
  const auth = useAuthController();
  const [character, setCharacter] = useState<BuildCharacterSlot>("main");
  const [activeBuildView, setActiveBuildView] =
    useState<"catalog" | "loadout" | "community">("catalog");
  const [profile, setProfile] = useState<BuildProfile>(emptyProfile);
  const [characters, setCharacters] = useState<BuildCharacter[]>([]);
  const [initialSigils, setInitialSigils] =
    useState<BuildSigil[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlot, setSavingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [selectingSlot, setSelectingSlot] =
    useState<BuildCharacterSlot | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<BuildSkill[]>([]);
  const [skillsCharacter, setSkillsCharacter] =
    useState<BuildCharacterClass | null>(null);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillIcon, setSkillIcon] = useState<File | null>(null);
  const [comboAvailable, setComboAvailable] = useState(false);
  const [skillSocketTypes, setSkillSocketTypes] = useState<
    Array<BuildSigilCategory | "">
  >(["", "", ""]);
  const [editorKey, setEditorKey] = useState(0);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [savingComboId, setSavingComboId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<BuildSkill | null>(null);
  const [editingSlot, setEditingSlot] = useState<{
    type: BuildSkillSlotType;
    index: number;
  } | null>(null);
  const [pendingSkillSlot, setPendingSkillSlot] = useState<{
    type: BuildSkillSlotType;
    index: number;
  } | null>(null);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterImage, setNewCharacterImage] =
    useState<File | null>(null);
  const [isSavingCharacterCatalog, setIsSavingCharacterCatalog] =
    useState(false);
  const [characterCatalogError, setCharacterCatalogError] =
    useState("");
  const characterCatalogFormRef = useRef<HTMLFormElement>(null);
  const skillFormRef = useRef<HTMLFormElement>(null);
  const selectedCharacter =
    character === "main" ? profile.mainCharacter : profile.mirrorCharacter;
  const selectedCharacterEntry = characters.find(
    (entry) => entry.name === selectedCharacter,
  );

  useEffect(() => {
    if (!auth.isBooting && !auth.user) {
      window.location.replace("/");
    }
  }, [auth.isBooting, auth.user]);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getBootstrap(controller.signal)
      .then((bootstrap) => {
        setProfile(bootstrap.profile);
        setCharacters(bootstrap.characters);
        setSkills(bootstrap.skills);
        setSkillsCharacter(bootstrap.profile.mainCharacter);
        setInitialSigils(bootstrap.sigils);
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
  }, []);

  useEffect(() => {
    if (!selectingSlot) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingSlot) {
        setSelectingSlot(null);
        setPendingSkillSlot(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [savingSlot, selectingSlot]);

  useEffect(() => {
    if (
      !auth.user ||
      !selectedCharacter ||
      selectedCharacter === skillsCharacter
    ) {
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
      .then((nextSkills) => {
        setSkills(nextSkills);
        setSkillsCharacter(selectedCharacter);
      })
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
  }, [auth.user, selectedCharacter, skillsCharacter]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return query
      ? characters.filter((entry) =>
          entry.name.toLocaleLowerCase("ru").includes(query),
        )
      : characters;
  }, [characters, search]);

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
    resetSkillEditor();
    setPendingSkillSlot(null);
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
      if (pendingSkillSlot) {
        const nextSlot = pendingSkillSlot;
        setPendingSkillSlot(null);
        startCreatingSkillSlot(
          nextSlot.type,
          nextSlot.index,
          true,
        );
      }
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

  async function createCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCharacterName.trim()) {
      setCharacterCatalogError("Укажите название персонажа.");
      return;
    }

    setIsSavingCharacterCatalog(true);
    setCharacterCatalogError("");
    try {
      const formData = new FormData();
      formData.set("name", newCharacterName);
      if (newCharacterImage) {
        formData.set(
          "image",
          await optimizeImageUpload(newCharacterImage, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.86,
          }),
        );
      }
      const created = await gateway.createCharacter(formData);
      setCharacters((current) => [...current, created]);
      setNewCharacterName("");
      setNewCharacterImage(null);
      characterCatalogFormRef.current?.reset();
    } catch (caught) {
      setCharacterCatalogError(
        caught instanceof Error
          ? caught.message
          : "Не удалось добавить персонажа.",
      );
    } finally {
      setIsSavingCharacterCatalog(false);
    }
  }

  async function updateCharacterImage(
    characterId: string,
    image: File,
  ) {
    setIsSavingCharacterCatalog(true);
    setCharacterCatalogError("");
    try {
      const updated = await gateway.updateCharacterImage(
        characterId,
        await optimizeImageUpload(image, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.86,
        }),
      );
      setCharacters((current) =>
        current.map((entry) =>
          entry.id === updated.id ? updated : entry,
        ),
      );
    } catch (caught) {
      setCharacterCatalogError(
        caught instanceof Error
          ? caught.message
          : "Не удалось обновить изображение персонажа.",
      );
    } finally {
      setIsSavingCharacterCatalog(false);
    }
  }

  function resetSkillEditor(form = skillFormRef.current) {
    form?.reset();
    setEditingSkill(null);
    setEditingSlot(null);
    setSkillName("");
    setSkillDescription("");
    setSkillIcon(null);
    setComboAvailable(false);
    setSkillSocketTypes(["", "", ""]);
    setEditorKey((current) => current + 1);
  }

  function activateCharacterSlot(slot: BuildCharacterSlot) {
    resetSkillEditor();
    setCharacter(slot);
  }

  function startEditingSkill(skill: BuildSkill) {
    skillFormRef.current?.reset();
    setEditingSkill(skill);
    setEditingSlot({ type: skill.slotType, index: skill.slotIndex });
    setSkillName(skill.name);
    setSkillDescription(skill.descriptionHtml);
    setSkillIcon(null);
    setComboAvailable(skill.comboAvailable);
    setSkillSocketTypes([
      skill.socketTypes[1] ?? "",
      skill.socketTypes[2] ?? "",
      skill.socketTypes[3] ?? "",
    ]);
    setSkillError("");
    setEditorKey((current) => current + 1);
    requestAnimationFrame(() => {
      document
        .getElementById("build-skill-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startCreatingSkillSlot(
    type: BuildSkillSlotType,
    index: number,
    characterIsSelected = false,
  ) {
    if (!selectedCharacter && !characterIsSelected) {
      setPendingSkillSlot({ type, index });
      setCharacter("main");
      setSelectingSlot("main");
      setSearch("");
      setError("");
      return;
    }

    skillFormRef.current?.reset();
    setEditingSkill(null);
    setEditingSlot({ type, index });
    setSkillName("");
    setSkillDescription("");
    setSkillIcon(null);
    setComboAvailable(false);
    setSkillSocketTypes(["", "", ""]);
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
    if (
      !selectedCharacter ||
      !editingSlot ||
      (!editingSkill && !skillIcon)
    ) {
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
      formData.set("slotType", editingSlot.type);
      formData.set("slotIndex", String(editingSlot.index));
      formData.set("name", skillName);
      formData.set("descriptionHtml", skillDescription);
      formData.set("comboAvailable", String(comboAvailable));
      formData.set(
        "socketTypes",
        JSON.stringify(skillSocketTypes.filter(Boolean)),
      );
      if (skillIcon) {
        formData.set(
          "icon",
          await optimizeImageUpload(skillIcon, {
            maxWidth: 256,
            maxHeight: 256,
            quality: 0.9,
          }),
        );
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

  async function toggleSkillCombo(skill: BuildSkill) {
    setSavingComboId(skill.id);
    setSkillError("");
    try {
      const updated = await skillGateway.setCombo(
        skill.id,
        !skill.comboEnabled,
      );
      setSkills((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setSkillError(
        caught instanceof Error
          ? caught.message
          : "Не удалось изменить состояние комбо.",
      );
    } finally {
      setSavingComboId(null);
    }
  }

  function renderFixedSkillSlot(
    slotType: BuildSkillSlotType,
    slotIndex: number,
  ) {
    const skill = skills.find(
      (item) =>
        item.slotType === slotType && item.slotIndex === slotIndex,
    );
    const isRabam = slotType === "rabam";
    const slotLabel = isRabam
      ? `Рабам ${slotIndex}`
      : `Навык ${slotIndex}`;
    const emptyClassName = [
      "build-skill-card",
      "build-skill-card--empty",
      isRabam ? "build-skill-card--rabam" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (!skill) {
      const emptySlotContent = (
        <>
          <div
            className={[
              "build-skill-card__icon-frame",
              isRabam ? "is-rabam" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            <Sparkles size={25} />
          </div>
          <div className="build-skill-card__empty-content">
            <small>{slotLabel}</small>
            <strong>Пустой слот</strong>
            <p>
              {canManageSkills
                ? "Нажмите и заполните название, иконку и описание."
                : "Администратор пока не добавил умение."}
            </p>
          </div>
          {canManageSkills ? (
            <span className="build-skill-slot-add">
              <Plus size={16} />
              Заполнить
            </span>
          ) : null}
        </>
      );

      if (canManageSkills) {
        return (
          <button
            className={emptyClassName}
            type="button"
            disabled={isCreatingSkill}
            key={`${slotType}-${slotIndex}`}
            onClick={() =>
              startCreatingSkillSlot(slotType, slotIndex)
            }
          >
            {emptySlotContent}
          </button>
        );
      }

      return (
        <article
          className={emptyClassName}
          key={`${slotType}-${slotIndex}`}
        >
          {emptySlotContent}
        </article>
      );
    }

    return (
      <article
        className={[
          "build-skill-card",
          skill.comboAvailable ? "build-skill-card--with-combo" : "",
          isRabam ? "build-skill-card--rabam" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        key={skill.id}
      >
        <div
          className={[
            "build-skill-card__icon-frame",
            isRabam ? "is-rabam" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Image
            className="build-skill-card__icon"
            src={skill.iconUrl}
            alt=""
            width={72}
            height={72}
            unoptimized
          />
        </div>
        <div className="build-skill-card__content">
          <header>
            <div>
              <small className="build-skill-card__slot-label">
                {slotLabel}
              </small>
              <h3>{skill.name}</h3>
              {skill.socketTypes.length > 0 ? (
                <div
                  className="build-skill-card__sockets"
                  aria-label="Сокеты сигилов"
                >
                  {Array.from({ length: 4 }, (_, index) => {
                    const socketType = skill.socketTypes[index];
                    return socketType ? (
                      <SigilSocketIcon
                        category={socketType}
                        key={`${socketType}-${index}`}
                      />
                    ) : (
                      <span
                        className="build-sigil-socket-icon is-empty"
                        aria-hidden="true"
                        key={`empty-${index}`}
                      >
                        <span />
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
                  title="Очистить слот"
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
        {skill.comboAvailable ? (
          <button
            className={[
              "build-skill-combo-toggle",
              skill.comboEnabled ? "is-enabled" : "is-disabled",
            ].join(" ")}
            type="button"
            aria-pressed={skill.comboEnabled}
            aria-label={`Выбрать состояние «${skill.comboEnabled ? "Без комбо" : "С комбо"}» для умения ${skill.name}`}
            title={skill.comboEnabled ? "С комбо" : "Без комбо"}
            disabled={savingComboId !== null}
            onClick={() => void toggleSkillCombo(skill)}
          >
            <Image
              src={
                skill.comboEnabled ? "/combo-on.webp" : "/combo-off.webp"
              }
              alt=""
              width={256}
              height={256}
              unoptimized
            />
            <span>Комбо</span>
          </button>
        ) : null}
      </article>
    );
  }

  function renderFixedSkillGroups() {
    return (
      <>
        <section className="build-skill-slot-group build-skill-slot-group--rabam">
          <header>
            <div>
              <span>Особые умения</span>
              <h3>Рабамы</h3>
            </div>
            <strong>4 слота</strong>
          </header>
          <div>
            {Array.from(
              { length: buildSkillSlotLimits.rabam },
              (_, index) =>
                renderFixedSkillSlot("rabam", index + 1),
            )}
          </div>
        </section>

        <section className="build-skill-slot-group">
          <header>
            <div>
              <span>Основной набор</span>
              <h3>Обычные навыки</h3>
            </div>
            <strong>13 слотов</strong>
          </header>
          <div>
            {Array.from(
              { length: buildSkillSlotLimits.normal },
              (_, index) =>
                renderFixedSkillSlot("normal", index + 1),
            )}
          </div>
        </section>
      </>
    );
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
        <MobileSiteNav current="build" />
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
            className={[
              "build-character-card",
              selectedCharacterEntry?.imageUrl
                ? "build-character-card--with-image"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-live="polite"
            aria-labelledby="build-character-title"
          >
            {selectedCharacterEntry?.imageUrl ? (
              <Image
                className="build-character-card__background"
                src={selectedCharacterEntry.imageUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 800px) 100vw, 900px"
                unoptimized
              />
            ) : null}
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
              onClick={() => activateCharacterSlot("main")}
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
              onClick={() => activateCharacterSlot("mirror")}
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

        <div className="build-view-tabs" role="tablist" aria-label="Разделы билда">
          <button
            className={activeBuildView === "catalog" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={activeBuildView === "catalog"}
            onClick={() => setActiveBuildView("catalog")}
          >
            <BookOpen size={16} />
            Библиотека навыков
          </button>
          <button
            className={activeBuildView === "loadout" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={activeBuildView === "loadout"}
            onClick={() => setActiveBuildView("loadout")}
          >
            <Sparkles size={16} />
            Мои билды
          </button>
          <button
            className={activeBuildView === "community" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={activeBuildView === "community"}
            onClick={() => setActiveBuildView("community")}
          >
            <UsersRound size={16} />
            Билды игроков
          </button>
        </div>

        {activeBuildView === "catalog" ? (
        <div className="build-library-layout">
          <div className="build-library-layout__skills">
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
              <span>{skills.length} / 17 умений</span>
            </header>

            {canManageSkills && editingSlot ? (
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
                    <span className="build-skill-editor__slot">
                      {editingSlot.type === "rabam"
                        ? `Рабам ${editingSlot.index} из 4`
                        : `Обычный навык ${editingSlot.index} из 13`}
                    </span>
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

                <fieldset className="build-skill-combo-choice">
                  <legend>Показывать пункт «Комбо»</legend>
                  <p>
                    Если добавить этот пункт, игрок сможет выбирать между
                    состояниями «С комбо» и «Без комбо». Если не добавлять —
                    на карточке ничего не появится.
                  </p>
                  <div>
                    <button
                      className={comboAvailable ? "is-selected" : ""}
                      type="button"
                      aria-pressed={comboAvailable}
                      disabled={isCreatingSkill}
                      onClick={() => setComboAvailable(true)}
                    >
                      Добавить выбор комбо
                    </button>
                    <button
                      className={!comboAvailable ? "is-selected" : ""}
                      type="button"
                      aria-pressed={!comboAvailable}
                      disabled={isCreatingSkill}
                      onClick={() => setComboAvailable(false)}
                    >
                      Нет пункта комбо
                    </button>
                  </div>
                </fieldset>

                {isSocketlessBuildSkillSlot(
                  editingSlot.type,
                  editingSlot.index,
                ) ? (
                  <div className="build-skill-socketless-note">
                    <strong>Навык 17 — без сокетов</strong>
                    <p>
                      Для последнего обычного навыка сокеты сигилов не
                      добавляются.
                    </p>
                  </div>
                ) : (
                  <fieldset className="build-skill-socket-editor">
                    <legend>Сокеты сигилов</legend>
                    <p>
                      Первый сокет всегда «Категория». Выберите типы ещё
                      для трёх сокетов.
                    </p>
                    <div>
                      <div className="build-skill-socket-editor__fixed">
                        <span className="build-skill-socket-editor__icon">
                          <SigilSocketIcon
                            category="Категория"
                            size="large"
                          />
                        </span>
                        <strong>Сокет 1</strong>
                        <span className="build-skill-socket-editor__fixed-value">
                          Категория · всегда
                        </span>
                      </div>
                      {skillSocketTypes.map((socketType, index) => (
                        <label key={index}>
                          <span>
                            {socketType ? (
                              <SigilSocketIcon
                                category={socketType}
                                size="large"
                              />
                            ) : (
                              <span
                                className="build-sigil-socket-icon build-sigil-socket-icon--large is-empty"
                                aria-hidden="true"
                              >
                                <span />
                              </span>
                            )}
                          </span>
                          <strong>Сокет {index + 2}</strong>
                          <select
                            value={socketType}
                            disabled={isCreatingSkill}
                            onChange={(event) => {
                              const next = [...skillSocketTypes];
                              next[index] = event.target.value as
                                | BuildSigilCategory
                                | "";
                              setSkillSocketTypes(next);
                            }}
                          >
                            <option value="">Пусто</option>
                            {configurableBuildSigilCategories.map(
                              (item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

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
              className="build-skill-fixed-catalog"
              aria-live="polite"
              aria-busy={isLoadingSkills}
            >
              {isLoadingSkills ? (
                <div className="build-skill-empty">
                  <span className="boot-screen__spinner" />
                  <p>Загружаем умения класса…</p>
                </div>
              ) : (
                <>
                  <section className="build-skill-slot-group build-skill-slot-group--rabam">
                    <header>
                      <div>
                        <span>Особые умения</span>
                        <h3>Рабамы</h3>
                      </div>
                      <strong>4 слота</strong>
                    </header>
                    <div>
                      {Array.from(
                        { length: buildSkillSlotLimits.rabam },
                        (_, index) =>
                          renderFixedSkillSlot("rabam", index + 1),
                      )}
                    </div>
                  </section>

                  <section className="build-skill-slot-group">
                    <header>
                      <div>
                        <span>Основной набор</span>
                        <h3>Обычные навыки</h3>
                      </div>
                      <strong>13 слотов</strong>
                    </header>
                    <div>
                      {Array.from(
                        { length: buildSkillSlotLimits.normal },
                        (_, index) =>
                          renderFixedSkillSlot("normal", index + 1),
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            <div
              hidden
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
                  <article
                    className={[
                      "build-skill-card",
                      skill.comboAvailable
                        ? "build-skill-card--with-combo"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={skill.id}
                  >
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
                    {skill.comboAvailable ? (
                      <button
                        className={[
                          "build-skill-combo-toggle",
                          skill.comboEnabled ? "is-enabled" : "is-disabled",
                        ].join(" ")}
                        type="button"
                        aria-pressed={skill.comboEnabled}
                        aria-label={`Выбрать состояние «${skill.comboEnabled ? "Без комбо" : "С комбо"}» для умения ${skill.name}`}
                        title={skill.comboEnabled ? "С комбо" : "Без комбо"}
                        disabled={savingComboId !== null}
                        onClick={() => void toggleSkillCombo(skill)}
                      >
                        <Image
                          src={
                            skill.comboEnabled
                              ? "/combo-on.webp"
                              : "/combo-off.webp"
                          }
                          alt=""
                          width={256}
                          height={256}
                          unoptimized
                        />
                        <span>Комбо</span>
                      </button>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
            ) : null}

            {!selectedCharacter && canManageSkills ? (
          <section
            className="build-skills-section build-skills-section--unassigned"
            aria-labelledby="build-empty-slots-title"
          >
            <header className="build-skills-heading">
              <div>
                <span className="section-kicker">
                  <BookOpen size={15} /> Слоты класса
                </span>
                <h2 id="build-empty-slots-title">
                  4 Рабама и 13 обычных навыков
                </h2>
                <p>
                  Нажмите на любой пустой слот. Если герой ещё не
                  выбран, сначала откроется список классов, а затем —
                  редактор этого слота.
                </p>
              </div>
              <span>0 / 17 умений</span>
            </header>

            <div className="build-skill-fixed-catalog">
              {renderFixedSkillGroups()}
            </div>
          </section>
            ) : null}
          </div>

          <SigilPanel
            key={isLoading ? "sigils-pending" : "sigils-ready"}
            canManage={canManageSkills}
            initialSigils={initialSigils ?? undefined}
            paused={isLoading}
            onSigilsChange={setInitialSigils}
          />
        </div>
        ) : activeBuildView === "loadout" ? (
          <PersonalBuildWorkspace
            characters={characters}
            initialCharacter={selectedCharacter}
            displayName={user.displayName}
            sigils={initialSigils ?? []}
          />
        ) : (
          <CommunityBuildsPanel
            characters={characters}
            sigils={initialSigils ?? []}
          />
        )}
      </main>

      {selectingSlot ? (
        <div
          className="build-picker-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingSlot) {
              setSelectingSlot(null);
              setPendingSkillSlot(null);
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
                onClick={() => {
                  setSelectingSlot(null);
                  setPendingSkillSlot(null);
                }}
                disabled={savingSlot !== null}
              >
                <X size={18} />
              </button>
            </header>

            {canManageSkills ? (
              <form
                ref={characterCatalogFormRef}
                className="build-character-admin-form"
                onSubmit={(event) => void createCharacter(event)}
              >
                <div>
                  <span>Редактор каталога</span>
                  <strong>Добавить нового персонажа</strong>
                </div>
                <label>
                  <span className="sr-only">Название персонажа</span>
                  <input
                    type="text"
                    value={newCharacterName}
                    minLength={2}
                    maxLength={40}
                    required
                    disabled={isSavingCharacterCatalog}
                    placeholder="Название нового персонажа"
                    onChange={(event) =>
                      setNewCharacterName(event.target.value)
                    }
                  />
                </label>
                <label className="build-character-admin-form__upload">
                  <ImagePlus size={16} />
                  <span>
                    {newCharacterImage
                      ? newCharacterImage.name
                      : "Фото 16:9 · необязательно"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isSavingCharacterCatalog}
                    onChange={(event) =>
                      setNewCharacterImage(
                        event.target.files?.[0] ?? null,
                      )
                    }
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    isSavingCharacterCatalog ||
                    !newCharacterName.trim()
                  }
                >
                  <Plus size={16} />
                  Добавить
                </button>
              </form>
            ) : null}

            {characterCatalogError ? (
              <p className="build-character-catalog-error" role="alert">
                {characterCatalogError}
              </p>
            ) : null}

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
              {filteredClasses.map((entry) => {
                const isSelected =
                  (selectingSlot === "main"
                    ? profile.mainCharacter
                    : profile.mirrorCharacter) === entry.name;
                return (
                  <article
                    className={[
                      "build-picker-character",
                      isSelected ? "is-selected" : "",
                      entry.imageUrl ? "has-image" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={entry.id}
                  >
                    {entry.imageUrl ? (
                      <Image
                        src={entry.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 520px) 100vw, 260px"
                        unoptimized
                      />
                    ) : null}
                    <button
                      className="build-picker-character__select"
                      type="button"
                      disabled={
                        savingSlot !== null ||
                        isSavingCharacterCatalog
                      }
                      onClick={() =>
                        void selectCharacter(entry.name)
                      }
                    >
                      <span>{entry.name}</span>
                      {isSelected ? <Check size={15} /> : null}
                    </button>
                    {canManageSkills ? (
                      <label
                        className="build-picker-character__image-action"
                        title={
                          entry.imageUrl
                            ? "Заменить изображение"
                            : "Добавить изображение"
                        }
                      >
                        <ImagePlus size={14} />
                        <span>
                          {entry.imageUrl ? "Заменить" : "Добавить фото"}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={isSavingCharacterCatalog}
                          onChange={(event) => {
                            const image = event.target.files?.[0];
                            if (image) {
                              void updateCharacterImage(
                                entry.id,
                                image,
                              );
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    ) : null}
                  </article>
                );
              })}
              {filteredClasses.length === 0 ? (
                <p className="build-picker-grid__empty">
                  Персонажи не найдены.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
