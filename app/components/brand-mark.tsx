import { Shield } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark${compact ? " brand-mark--compact" : ""}`}>
      <span className="brand-mark__crest" aria-hidden="true">
        <Shield size={compact ? 18 : 22} strokeWidth={1.7} />
        <span>DO</span>
      </span>
      <span>
        <strong>DARK ORDEN</strong>
        {!compact && <small>Guild command center</small>}
      </span>
    </div>
  );
}
