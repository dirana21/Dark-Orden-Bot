"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Palette,
} from "lucide-react";

const textColorPresets = [
  { name: "Голубой", color: "#00ffe1", rgb: "0, 255, 225" },
  { name: "Жёлтый", color: "#ffea00", rgb: "255, 234, 0" },
  { name: "Оранжевый", color: "#ff9600", rgb: "255, 150, 0" },
  { name: "Красный", color: "#ff0000", rgb: "255, 0, 0" },
  { name: "Красно-оранжевый", color: "#c2450f", rgb: "194, 69, 15" },
  { name: "Синий", color: "#0734e9", rgb: "7, 52, 233" },
] as const;

interface SkillDescriptionEditorProps {
  initialHtml?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SkillDescriptionEditor({
  initialHtml = "",
  onChange,
  disabled = false,
}: SkillDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  function rememberSelection() {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selection || !savedRange.current) {
      editorRef.current?.focus();
      return;
    }
    selection.removeAllRanges();
    selection.addRange(savedRange.current);
  }

  function applyCommand(command: string, argument?: string) {
    restoreSelection();
    if (command === "foreColor") {
      document.execCommand("styleWithCSS", false, "true");
    }
    document.execCommand(command, false, argument);
    rememberSelection();
    onChange(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="skill-rich-editor">
      <div className="skill-rich-editor__toolbar" aria-label="Форматирование описания">
        <button
          type="button"
          title="Жирный текст"
          aria-label="Жирный текст"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("bold")}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          title="Курсив"
          aria-label="Курсив"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("italic")}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="Маркированный список"
          aria-label="Маркированный список"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("insertUnorderedList")}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          title="Нумерованный список"
          aria-label="Нумерованный список"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("insertOrderedList")}
        >
          <ListOrdered size={16} />
        </button>
        <label
          className={disabled ? "is-disabled" : ""}
          title="Цвет выделенного текста"
        >
          <Palette size={16} />
          <span>Цвет текста</span>
          <input
            type="color"
            defaultValue="#55d8bd"
            disabled={disabled}
            aria-label="Выбрать цвет выделенного текста"
            onMouseDown={rememberSelection}
            onChange={(event) => applyCommand("foreColor", event.target.value)}
          />
        </label>
        <button
          type="button"
          title="Убрать форматирование"
          aria-label="Убрать форматирование"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("removeFormat")}
        >
          <Eraser size={15} />
        </button>
        <span
          className="skill-rich-editor__palette"
          role="group"
          aria-label="Готовые цвета текста"
        >
          {textColorPresets.map((preset) => (
            <button
              className="skill-rich-editor__swatch"
              type="button"
              key={preset.color}
              title={`${preset.name} — RGB ${preset.rgb}`}
              aria-label={`${preset.name}, RGB ${preset.rgb}`}
              disabled={disabled}
              style={{ "--skill-text-color": preset.color } as React.CSSProperties}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyCommand("foreColor", preset.color)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </span>
      </div>
      <div
        ref={editorRef}
        className="skill-rich-editor__surface"
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Описание умения"
        data-placeholder="Опишите умение, выделяйте важные значения цветом и добавляйте списки…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={rememberSelection}
      />
    </div>
  );
}
