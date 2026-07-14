import type { StageLevel } from "../lib/stages";

export type TabKey = "home" | "forecast" | "safety";

interface Props {
  tab: TabKey;
  onTab: (t: TabKey) => void;
  level?: StageLevel;
}

const ITEMS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  {
    key: "home",
    label: "현황",
    icon: (
      <path d="M4 12l8-7 8 7M6 10.5V19h12v-8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    key: "forecast",
    label: "예보",
    icon: (
      <path d="M4 16l4-4 3 3 5-6 4 4M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    key: "safety",
    label: "안전가이드",
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9.3 12l1.9 1.9 3.6-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
];

export function BottomNav({ tab, onTab, level }: Props) {
  return (
    <nav className="bnav" aria-label="주요 메뉴">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          className={`bnav__btn ${tab === it.key ? "is-on" : ""}`}
          aria-current={tab === it.key ? "page" : undefined}
          onClick={() => onTab(it.key)}
        >
          <span className="bnav__icon">
            <svg width="24" height="24" viewBox="0 0 24 24">{it.icon}</svg>
            {it.key === "home" && level && level !== "normal" && (
              <span className={`bnav__pulse stage-${level}`} aria-hidden="true" />
            )}
          </span>
          <span className="bnav__label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
