"use client";

import { formatWeekChip } from "@/lib/date";

interface WeekPickerProps {
  weeks: string[];
  selected: string[];
  onToggle: (week: string) => void;
}

export default function WeekPicker({ weeks, selected, onToggle }: WeekPickerProps) {
  // 最新的周排在最左：默认选中的是本周，避免打开时还要横向滚动才能看到
  const ordered = [...weeks].reverse();

  return (
    <div className="-mx-4 px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-1.5 w-max py-1">
        {ordered.map((week) => {
          const isSelected = selected.includes(week);
          return (
            <button
              key={week}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(week)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                isSelected
                  ? "border-primary bg-primary font-medium text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary"
              }`}
            >
              {formatWeekChip(week)}
              {isSelected && selected.length > 1 && (
                <span className="ml-1 opacity-85">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
