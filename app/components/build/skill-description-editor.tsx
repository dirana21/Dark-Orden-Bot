"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Palette,
} from "lucide-react";

interface SkillDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SkillDescriptionEditor({
  value,
  onChange,
  disabled = false,
}: SkillDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [initialValue] = useState(value);

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
        dangerouslySetInnerHTML={{ __html: initialValue }}
      />
    </div>
  );
}
