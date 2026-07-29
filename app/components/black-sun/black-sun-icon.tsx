import Image from "next/image";
import type { CSSProperties } from "react";

export function BlackSunIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="black-sun-symbol"
      style={{ "--black-sun-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="black-sun-symbol__aura" />
      <Image
        className="black-sun-symbol__image"
        src="/black-sun-icon.webp"
        width={size}
        height={size}
        alt=""
        unoptimized
      />
    </span>
  );
}
