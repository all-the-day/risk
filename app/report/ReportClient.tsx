"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WeekPicker from "@/components/WeekPicker";
import MemberCards from "./MemberCards";
import MemberTable from "./MemberTable";
import { formatWeekLabel } from "@/lib/date";
import { percent } from "@/lib/score";
import type { MemberWeekRow } from "@/services/weekly-score";

interface ReportClientProps {
  weeks: string[];
  members: MemberWeekRow[];
  maxScore: number;
}

export default function ReportClient({
  weeks,
  members,
  maxScore,
}: ReportClientProps) {
  const [selected, setSelected] = useState<string[]>([weeks[weeks.length - 1]]);
  const [view, setView] = useState<"cards" | "table">("cards");

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
      <div className="mb-3">
        <h2 className="text-sm font-medium">选择周次</h2>
        <p className="text-xs text-muted-foreground">
          可多选，多选后每位成员会显示趋势
        </p>
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
            {formatWeekLabel(currentWeek)}　·　满分 {maxScore}/人
          </p>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">
          {view === "cards" ? "成员" : "本家表格"}
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setView(view === "cards" ? "table" : "cards")}
        >
          {view === "cards" ? "切换表格视图" : "切换卡片视图"}
        </Button>
      </div>

      {view === "cards" ? (
        <MemberCards
          members={members}
          weeks={orderedSelected}
          currentWeek={currentWeek}
          maxScore={maxScore}
        />
      ) : (
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
