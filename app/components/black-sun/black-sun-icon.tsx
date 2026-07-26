import { Sun } from "lucide-react";
import type { CSSProperties } from "react";

export function BlackSunIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="black-sun-symbol"
      style={{ "--black-sun-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="black-sun-symbol__aura" />
      <Sun size={size} strokeWidth={2.1} />
      <span className="black-sun-symbol__core" />
    </span>
  );
}
