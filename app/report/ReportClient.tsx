"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

const VIEWS = [
  { value: "cards", label: "成员" },
  { value: "chart", label: "图表" },
  { value: "table", label: "表格" },
] as const;

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
        return prev.filter((item) => item !== week);
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>选择周次</CardTitle>
          <CardDescription>可多选，看趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <WeekPicker
            weeks={weeks}
            selected={orderedSelected}
            onToggle={toggleWeek}
          />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>本家本周得分</CardTitle>
          <CardDescription>
            {groupName} · {formatWeekLabel(currentWeek)} · 满分 {maxScore}/人
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {total}
              <span className="text-xs font-medium text-muted-foreground">
                {" "}
                / {maxTotal}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {fullCount} / {members.length} 人满分
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                total >= maxTotal && maxTotal > 0
                  ? "bg-success-foreground"
                  : "bg-primary"
              }`}
              style={{ width: `${percent(total, maxTotal)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-2">
        <ToggleGroup
          value={[view]}
          onValueChange={(value) =>
            setView(((value as string[])[0] as typeof view) ?? "cards")
          }
          variant="outline"
          size="sm"
        >
          {VIEWS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {view === "chart" && (
          <ToggleGroup
            value={[chartType]}
            onValueChange={(value) =>
              setChartType(((value as string[])[0] as "bar" | "line") ?? "bar")
            }
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="bar">柱状</ToggleGroupItem>
            <ToggleGroupItem value="line">折线</ToggleGroupItem>
          </ToggleGroup>
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
