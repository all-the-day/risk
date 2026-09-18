"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeekPicker from "@/components/WeekPicker";
import { formatWeekLabel } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { MemberWeekRow } from "@/services/weekly-score";

interface ScoreGridClientProps {
  groups: { id: string; name: string }[];
  groupId: string;
  weeks: string[];
  members: MemberWeekRow[];
  maxScore: number;
}

const cellKey = (userId: string, week: string) => `${userId}|${week}`;

export default function ScoreGridClient({
  groups,
  groupId,
  weeks,
  members,
  maxScore,
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
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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
    const override = overrides[cellKey(userId, week)];
    return (
      override ??
      members.find((member) => member.userId === userId)?.byWeek[week]?.auto ??
      0
    );
  }

  async function save(userId: string, week: string, raw: string) {
    const key = cellKey(userId, week);
    setEditing(null);

    const text = raw.trim();
    if (text === "") return; // 清空视为取消

    const value = Number(text);
    if (!Number.isInteger(value) || value < 0) {
      toast.add({ title: "请输入不小于 0 的整数", type: "error" });
      return;
    }
    if (value > maxScore) {
      toast.add({ title: `分数不能超过满分 ${maxScore}`, type: "error" });
      return;
    }

    setBusy(key);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, groupId, weekStart: week, score: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setOverrides((prev) => ({ ...prev, [key]: value }));
      toast.add({
        title: `已录入 ${value} 分（已锁定）`,
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "保存失败",
        type: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function revert(userId: string, week: string) {
    const key = cellKey(userId, week);
    setBusy(key);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, groupId, weekStart: week }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "恢复失败");
      setOverrides((prev) => ({ ...prev, [key]: null }));
      toast.add({ title: "已恢复按自打卡汇总", type: "success" });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "恢复失败",
        type: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>周分录入</CardTitle>
          <CardDescription>
            默认按成员自打卡汇总；录入后覆盖并锁定，可随时恢复自动
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={groupId}
              onValueChange={(value) => {
                if (value) router.push(`/admin/scores?group=${value}`);
              }}
            >
              <SelectTrigger size="sm" className="min-w-40">
                <SelectValue>
                  {(value: string | null) =>
                    groups.find((group) => group.id === value)?.name ??
                    "选择家"
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
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-4 w-8 rounded border border-border bg-muted" />
              自动：成员自打卡汇总，点 ＋ / ✎ 可录入覆盖
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-4 w-8 rounded border border-border bg-warning" />
              已锁定：管理员录入，优先于自打卡，可恢复自动
            </span>
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
                  const auto = member.byWeek[week]?.auto ?? 0;
                  const override = overrides[key];
                  const locked = override !== null && override !== undefined;
                  const value = locked ? override : auto;

                  if (editing === key) {
                    return (
                      <td key={week} className="border-b bg-primary/5 p-1.5">
                        <div className="flex justify-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            defaultValue={value}
                            autoFocus
                            className="h-8 w-16 rounded-lg border-2 border-ring bg-card text-center text-sm font-semibold tabular-nums outline-none"
                            onBlur={(event) =>
                              save(member.userId, week, event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                              if (event.key === "Escape") setEditing(null);
                            }}
                          />
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={week}
                      className={`border-b p-1.5 ${
                        locked ? "bg-warning" : "bg-muted"
                      } ${busy === key ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm font-semibold tabular-nums">
                          {value}
                        </span>
                        <Badge
                          variant={locked ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {locked ? "已锁定" : "自动"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={locked ? "修改分数" : "录入本周总分"}
                          aria-label={locked ? "修改分数" : "录入本周总分"}
                          onClick={() => setEditing(key)}
                        >
                          {busy === key ? (
                            <Spinner />
                          ) : locked ? (
                            <PencilIcon />
                          ) : (
                            <PlusIcon />
                          )}
                        </Button>
                        {locked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-primary hover:text-primary"
                            onClick={() => revert(member.userId, week)}
                          >
                            恢复自动
                          </Button>
                        )}
                      </div>
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
    </div>
  );
}
