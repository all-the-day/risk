"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeekPicker from "@/components/WeekPicker";
import { formatWeekLabel } from "@/lib/date";
import ScoreEntrySheet, {
  type EntryItem,
  type EntryTarget,
} from "./ScoreEntrySheet";
import type { MemberWeekRow } from "@/services/weekly-score";

interface ScoreGridClientProps {
  groups: { id: string; name: string }[];
  groupId: string;
  weeks: string[];
  members: MemberWeekRow[];
  maxScore: number;
  items: EntryItem[];
}

const cellKey = (userId: string, week: string) => `${userId}|${week}`;

export default function ScoreGridClient({
  groups,
  groupId,
  weeks,
  members,
  maxScore,
  items,
}: ScoreGridClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(weeks.slice(-2));
  const [overrides, setOverrides] = useState<Record<string, number | null>>(
    () => {
      const init: Record<string, number | null> = {};
      for (const member of members) {
        for (const week of weeks) {
          init[cellKey(member.userId, week)] =
            member.byWeek[week]?.override ?? null;
        }
      }
      return init;
    }
  );
  const [entry, setEntry] = useState<EntryTarget | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 每次打开换一个 key，让抽屉按最新的 auto / override 重新初始化；关闭时 key 不变，退场动画正常
  const [openSeq, setOpenSeq] = useState(0);
  // 抽屉里改过打卡后回传的最新自动分，省掉一次服务端往返
  const [autoMap, setAutoMap] = useState<Record<string, number>>({});

  // 换家后成员变了，旧的自动分不能再用
  useEffect(() => {
    setAutoMap({});
  }, [groupId]);

  const orderedWeeks = weeks.filter((week) => selected.includes(week));

  function toggleWeek(week: string) {
    setSelected((prev) => {
      if (prev.includes(week)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== week);
      }
      return [...prev, week].sort();
    });
  }

  function valueOf(userId: string, week: string) {
    const key = cellKey(userId, week);
    const override = overrides[key];
    if (override !== null && override !== undefined) return override;
    return (
      autoMap[key] ??
      members.find((member) => member.userId === userId)?.byWeek[week]?.auto ??
      0
    );
  }

  const entryCell = entry
    ? members.find((member) => member.userId === entry.userId)?.byWeek[
        entry.week
      ]
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>周分录入</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select
            value={groupId}
            onValueChange={(value) => {
              if (value) router.push(`/admin/scores?group=${value}`);
            }}
          >
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue>
                {(value: string | null) =>
                  groups.find((group) => group.id === value)?.name ?? "选择家"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="min-w-0 flex-1">
            <WeekPicker
              weeks={weeks}
              selected={orderedWeeks}
              onToggle={toggleWeek}
            />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border-b bg-card px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                成员
              </th>
              {orderedWeeks.map((week) => (
                <th
                  key={week}
                  className="border-b bg-card px-2 py-2 text-center text-xs font-semibold whitespace-nowrap"
                >
                  {formatWeekLabel(week)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="sticky left-0 z-10 border-b bg-card px-3 py-2 font-medium whitespace-nowrap shadow-[1px_0_0_var(--border)]">
                  {member.nickname}
                </td>
                {orderedWeeks.map((week) => {
                  const key = cellKey(member.userId, week);
                  const override = overrides[key];
                  const locked = override !== null && override !== undefined;
                  const value = valueOf(member.userId, week);

                  return (
                    <td
                      key={week}
                      className={`border-b p-0 ${
                        locked ? "bg-warning" : "bg-muted"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEntry({
                            userId: member.userId,
                            nickname: member.nickname,
                            week,
                          });
                          setOpenSeq((seq) => seq + 1);
                          setSheetOpen(true);
                        }}
                        aria-label={`录入 ${member.nickname} ${formatWeekLabel(week)}，当前 ${value} 分（${locked ? "已锁定" : "自动"}）`}
                        className="flex w-full items-center justify-center gap-1.5 px-2 py-2.5 transition-colors hover:bg-foreground/5"
                      >
                        <span className="text-sm font-semibold tabular-nums">
                          {value}
                        </span>
                        <span
                          className={`text-[10px] ${
                            locked ? "text-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {locked ? "已锁定" : "自动"}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 z-10 bg-muted px-3 py-2 text-xs font-semibold whitespace-nowrap">
                本家合计
              </td>
              {orderedWeeks.map((week) => (
                <td
                  key={week}
                  className="bg-muted px-2 py-2 text-center text-xs font-semibold tabular-nums"
                >
                  {members.reduce(
                    (sum, member) => sum + valueOf(member.userId, week),
                    0
                  )}
                  / {maxScore * members.length}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <ScoreEntrySheet
        key={openSeq}
        open={sheetOpen}
        groupId={groupId}
        target={entry}
        auto={
          entry
            ? (autoMap[cellKey(entry.userId, entry.week)] ??
              entryCell?.auto ??
              0)
            : 0
        }
        override={entry ? (overrides[cellKey(entry.userId, entry.week)] ?? null) : null}
        maxScore={maxScore}
        items={items}
        onClose={() => setSheetOpen(false)}
        onTotalSaved={(userId, week, override) => {
          setOverrides((prev) => ({ ...prev, [cellKey(userId, week)]: override }));
        }}
        onAutoChange={(userId, week, auto) =>
          setAutoMap((prev) => ({ ...prev, [cellKey(userId, week)]: auto }))
        }
      />
    </div>
  );
}
