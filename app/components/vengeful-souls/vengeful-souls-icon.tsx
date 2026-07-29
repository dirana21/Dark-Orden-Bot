import Image from "next/image";
import type { CSSProperties } from "react";

export function VengefulSoulsIcon({ size = 18 }: { size?: number }) {
  return (
    <span
      className="vengeful-souls-symbol"
      style={{ "--vengeful-souls-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="vengeful-souls-symbol__aura" />
      <Image
        className="vengeful-souls-symbol__image"
        src="/vengeful-souls-icon.webp"
        width={size}
        height={size}
        alt=""
        unoptimized
      />
    </span>
  );
}
