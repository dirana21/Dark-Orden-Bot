"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  Gem,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import { HttpBuildSigilGateway } from "@/app/lib/build-client";
import {
  buildSigilCategories,
  type BuildSigil,
  type BuildSigilCategory,
} from "@/domain/build/sigil-model";

const gateway = new HttpBuildSigilGateway();

interface SigilPanelProps {
  canManage: boolean;
}

export function SigilPanel({ canManage }: SigilPanelProps) {
  const [sigils, setSigils] = useState<BuildSigil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<BuildSigilCategory>("Безупречное");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .list(controller.signal)
      .then((items) => {
        setSigils(items);
        setError("");
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Не удалось загрузить сигилы.",
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

  async function createSigil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!icon) {
      setError("Добавьте иконку сигила.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("category", category);
      formData.set("description", description);
      formData.set("icon", icon);
      const created = await gateway.create(formData);
      setSigils((current) => [...current, created]);
      formRef.current?.reset();
      setName("");
      setCategory("Безупречное");
      setDescription("");
      setIcon(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось добавить сигил.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSigil(id: string) {
    setDeletingId(id);
    setError("");
    try {
      await gateway.delete(id);
      setSigils((current) =>
        current.filter((sigil) => sigil.id !== id),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось удалить сигил.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="build-sigil-panel" aria-labelledby="sigil-panel-title">
      <header className="build-sigil-panel__heading">
        <span>
          <Gem size={18} />
        </span>
        <div>
          <small>Усиления навыков</small>
          <h2 id="sigil-panel-title">Сигилы</h2>
        </div>
        <strong>{sigils.length}</strong>
      </header>

      {canManage ? (
        <form
          ref={formRef}
          className="build-sigil-form"
          onSubmit={(event) => void createSigil(event)}
        >
          <label>
            <span>Название сигила</span>
            <input
              type="text"
              value={name}
              minLength={2}
              maxLength={80}
              required
              disabled={isSaving}
              placeholder="Название"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            <span>Категория</span>
            <select
              className={
                category === "Категория" ? "is-category-type" : ""
              }
              value={category}
              disabled={isSaving}
              onChange={(event) =>
                setCategory(event.target.value as BuildSigilCategory)
              }
            >
              {buildSigilCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Описание усиления</span>
            <textarea
              value={description}
              minLength={2}
              maxLength={1000}
              required
              disabled={isSaving}
              placeholder="Что изменяет этот сигил…"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="build-sigil-upload">
            <ImagePlus size={17} />
            <span>
              <strong>{icon ? icon.name : "Иконка сигила"}</strong>
              <small>PNG, JPG или WEBP · до 2 МБ</small>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              disabled={isSaving}
              onChange={(event) =>
                setIcon(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <button
            type="submit"
            disabled={
              isSaving ||
              !name.trim() ||
              !description.trim() ||
              !icon
            }
          >
            <Plus size={15} />
            {isSaving ? "Добавляем…" : "Добавить сигил"}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="build-sigil-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="build-sigil-list"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <div className="build-sigil-empty">
            <span className="boot-screen__spinner" />
            <p>Загружаем сигилы…</p>
          </div>
        ) : sigils.length === 0 ? (
          <div className="build-sigil-empty">
            <Gem size={25} />
            <strong>Сигилов пока нет</strong>
            <p>
              {canManage
                ? "Создайте первый сигил в форме выше."
                : "Администратор скоро заполнит каталог."}
            </p>
          </div>
        ) : (
          sigils.map((sigil) => (
            <article className="build-sigil-card" key={sigil.id}>
              <div className="build-sigil-card__title">
                <span aria-hidden="true" />
                <h3>{sigil.name}</h3>
                {canManage ? (
                  <button
                    type="button"
                    title="Удалить сигил"
                    aria-label={`Удалить сигил ${sigil.name}`}
                    disabled={deletingId !== null}
                    onClick={() => void deleteSigil(sigil.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              <div className="build-sigil-card__body">
                <div className="build-sigil-card__icon-frame">
                  <Image
                    src={sigil.iconUrl}
                    alt=""
                    width={68}
                    height={68}
                    unoptimized
                  />
                </div>
                <div>
                  <small
                    className={
                      sigil.category === "Категория"
                        ? "is-category-type"
                        : ""
                    }
                  >
                    {sigil.category}
                  </small>
                  <p>{sigil.description}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
