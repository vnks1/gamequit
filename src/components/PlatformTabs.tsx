"use client";

import type { Platform } from "@/lib/rss";

const tabs: { label: string; value: Platform }[] = [
  { label: "TODAS", value: "all" },
  { label: "PC", value: "pc" },
  { label: "CONSOLES", value: "console" },
];

type PlatformTabsProps = {
  active: Platform;
  onSelect: (platform: Platform) => void;
};

export default function PlatformTabs({ active, onSelect }: PlatformTabsProps) {
  return (
    <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-zinc-400 md:text-sm">
      {tabs.map((tab) => {
        const isActive = tab.value === active;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSelect(tab.value)}
            className={
              isActive
                ? "rounded-sm bg-[#65A30D] px-3 py-1 text-black"
                : "cursor-pointer transition-colors hover:text-zinc-200"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
