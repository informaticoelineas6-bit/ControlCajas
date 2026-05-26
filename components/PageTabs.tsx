"use client";

import type { PageTabItem } from "@/app/(app)/tabs";

interface PageTabsProps {
  items: PageTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function PageTabs({
  items,
  activeKey,
  onSelect,
}: Readonly<PageTabsProps>) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_6px_16px_-6px_rgba(59,130,246,0.7)]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            {item.icon}
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
