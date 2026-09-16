import { Link } from "@tanstack/react-router";
import { X, GitCompare } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { useI18n } from "@/lib/i18n";

export function CompareBar() {
  const { slugs, remove, clear } = useCompare();
  const { t } = useI18n();
  if (slugs.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-paper border border-hairline shadow-lg px-4 py-3 flex items-center gap-3 max-w-[95vw]">
      <GitCompare size={16} className="text-[color:var(--accent)]" />
      <div className="flex items-center gap-2 flex-wrap">
        {slugs.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 border border-hairline px-2 py-1 text-[11px] tracking-wide"
          >
            <span className="max-w-[110px] truncate">{s.replace(/-/g, " ")}</span>
            <button
              type="button"
              aria-label={`${t("cta.remove")} ${s}`}
              onClick={() => remove(s)}
              className="text-ink/50 hover:text-[color:var(--accent)]"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <Link to="/compare" className="cta-red !py-2 !px-3 text-[11px]">
        {t("cta.compare")} ({slugs.length})
      </Link>
      <button
        type="button"
        onClick={clear}
        className="text-[10px] tracking-widest uppercase text-ink/50 hover:text-ink"
      >
        Clear
      </button>
    </div>
  );
}
