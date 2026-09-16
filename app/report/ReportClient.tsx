"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import WeekPicker from "@/components/WeekPicker";
import MemberCards from "./MemberCards";
import MemberChart from "./MemberChart";
import MemberTable from "./MemberTable";
import { formatWeekLabel } from "@/lib/date";
import { percent } from "@/lib/score";
import type { MemberWeekRow } from "@/services/weekly-score";

interface ReportClientProps {
  groupName: string;
  weeks: string[];
  members: MemberWeekRow[];
  maxScore: number;
}

const VIEWS: { value: "cards" | "chart" | "table"; label: string }[] = [
  { value: "cards", label: "成员" },
  { value: "chart", label: "图表" },
  { value: "table", label: "表格" },
];

export default function ReportClient({
  groupName,
  weeks,
  members,
  maxScore,
}: ReportClientProps) {
  const [selected, setSelected] = useState<string[]>([weeks[weeks.length - 1]]);
  const [view, setView] = useState<"cards" | "chart" | "table">("cards");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const orderedSelected = weeks.filter((week) => selected.includes(week));
  const currentWeek = orderedSelected[orderedSelected.length - 1];

  function toggleWeek(week: string) {
    setSelected((prev) => {
      if (prev.includes(week)) {
        if (prev.length === 1) return prev; // 至少保留一周
        return prev.filter((w) => w !== week);
      }
      return [...prev, week].sort();
    });
  }

  const total = members.reduce(
    (sum, member) => sum + (member.byWeek[currentWeek]?.score ?? 0),
    0
  );
  const maxTotal = maxScore * members.length;
  const fullCount = members.filter(
    (member) => (member.byWeek[currentWeek]?.score ?? 0) >= maxScore
  ).length;

  return (
    <>
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-sm font-medium">选择周次</h2>
        <span className="text-xs text-muted-foreground">可多选</span>
      </div>
      <WeekPicker weeks={weeks} selected={orderedSelected} onToggle={toggleWeek} />

      <Card className="my-4">
        <CardContent className="p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted-foreground">本家本周得分</p>
              <p className="text-2xl font-bold tracking-tight">
                {total}
                <span className="text-xs font-medium text-muted-foreground">
                  / {maxTotal}
                </span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {fullCount} / {members.length} 人满分
            </p>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                total >= maxTotal && maxTotal > 0
                  ? "bg-success-foreground"
                  : "bg-primary"
              }`}
              style={{ width: `${percent(total, maxTotal)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {groupName} · {formatWeekLabel(currentWeek)} · 满分 {maxScore}/人
          </p>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-0.5 rounded-lg bg-muted p-1">
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              aria-pressed={view === option.value}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                view === option.value
                  ? "bg-card font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {view === "chart" && (
          <div className="flex gap-0.5 rounded-lg bg-muted p-1">
            {(["bar", "line"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setChartType(option)}
                aria-pressed={chartType === option}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  chartType === option
                    ? "bg-card font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {option === "bar" ? "柱状" : "折线"}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "chart" && orderedSelected.length === 1 && (
        <p className="mb-2 text-xs text-muted-foreground">
          多选几个周次，就能看出趋势
        </p>
      )}

      {view === "cards" && (
        <MemberCards
          members={members}
          weeks={orderedSelected}
          currentWeek={currentWeek}
          maxScore={maxScore}
        />
      )}

      {view === "chart" && (
        <MemberChart
          members={members}
          weeks={orderedSelected}
          maxScore={maxScore}
          type={chartType}
        />
      )}

      {view === "table" && (
        <MemberTable
          members={members}
          weeks={orderedSelected}
          maxScore={maxScore}
        />
      )}

      <BottomNav />
    </>
  );
}
