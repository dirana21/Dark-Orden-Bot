import { Sun } from "lucide-react";

export function BlackSunIcon({ size = 18 }: { size?: number }) {
  return (
    <span className="black-sun-symbol" aria-hidden="true">
      <Sun size={size} strokeWidth={1.8} />
    </span>
  );
}
