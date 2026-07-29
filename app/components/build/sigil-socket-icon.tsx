import type { BuildSigilCategory } from "@/domain/build/sigil-model";

interface SigilSocketIconProps {
  category: BuildSigilCategory;
  size?: "small" | "large";
}

export function SigilSocketIcon({
  category,
  size = "small",
}: SigilSocketIconProps) {
  return (
    <span
      className={`build-sigil-socket-icon build-sigil-socket-icon--${size}`}
      data-socket-category={category}
      title={category}
      aria-label={`Сокет: ${category}`}
    >
      <span aria-hidden="true" />
    </span>
  );
}
