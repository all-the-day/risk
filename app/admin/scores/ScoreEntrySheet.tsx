"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/components/ui/toast";
import {
  formatMonthDay,
  formatWeekLabel,
  formatWeekdayShort,
  getTodayString,
  getWeekDates,
  isAllowedOnDate,
} from "@/lib/date";
import { displayScore, earnedCenti, sumCenti } from "@/lib/score";

export type EntryItem = {
  id: string;
  name: string;
  score: number;
  checksPerWeek: number;
  allowedWeekdays: string | null;
};

export type EntryTarget = {
  userId: string;
  nickname: string;
  week: string;
};

interface ScoreEntrySheetProps {
  groupId: string;
  open: boolean;
  target: EntryTarget | null;
  auto: number;
  override: number | null;
  maxScore: number;
  items: EntryItem[];
  onTotalSaved: (userId: string, week: string, override: number | null) => void;
  // 按表格改动后把重算的自动分回传，让外层网格立即跟着变（不依赖服务端刷新）
  onAutoChange: (userId: string, week: string, auto: number) => void;
  onClose: () => void;
}

const cellKeyOf = (itemId: string, date: string) => `${itemId}|${date}`;

// 按勾选态算该周自动分，与 lib/score 的服务端口径一致
function computeAuto(items: EntryItem[], days: string[], checked: Set<string>) {
  return displayScore(
    sumCenti(
      items.map((item) =>
        earnedCenti(
          days.filter((date) => checked.has(cellKeyOf(item.id, date))).length,
          item.score,
          item.checksPerWeek
        )
      )
    )
  );
}

// 默认选中态只是淡淡的 bg-muted，在抽屉背景上几乎看不出来
const modeItemClass = "aria-pressed:border-primary aria-pressed:text-primary";

export default function ScoreEntrySheet({
  groupId,
  open,
  target,
  auto,
  override,
  maxScore,
  items,
  onTotalSaved,
  onAutoChange,
  onClose,
}: ScoreEntrySheetProps) {
  const [mode, setMode] = useState<"total" | "grid">("total");
  const [totalInput, setTotalInput] = useState(() => String(override ?? auto));
  const [totalDirty, setTotalDirty] = useState(false);
  const [savingTotal, setSavingTotal] = useState(false);
  const [checked, setChecked] = useState<Set<string> | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);

  const userId = target?.userId;
  const week = target?.week;

  // 打开时按需拉该成员该周的打卡明细（组件由 key 重挂载，这里只跑一次）
  useEffect(() => {
    if (!userId || !week) return;
    let cancelled = false;

    fetch(
      `/api/admin/records?userId=${encodeURIComponent(userId)}&weekStart=${encodeURIComponent(week)}`
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "读取打卡记录失败");
        if (cancelled) return;
        setChecked(
          new Set(
            (data.records as { itemId: string; date: string }[]).map((record) =>
              cellKeyOf(record.itemId, record.date)
            )
          )
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setChecked(new Set());
        toast.add({
          title: error instanceof Error ? error.message : "读取打卡记录失败",
          type: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId, week]);

  const days = useMemo(() => (week ? getWeekDates(week) : []), [week]);
  const today = getTodayString();

  // 按表格算出的本周合计；明细未读到时为 null，此时退回服务端给的 auto
  const tableTotal = useMemo(
    () => (checked ? computeAuto(items, days, checked) : null),
    [checked, days, items]
  );
  const liveAuto = tableTotal ?? auto;

  function switchMode(next: "total" | "grid") {
    setMode(next);
    // 切回「按总分」时同步输入框（用户手动改过就不覆盖）
    if (next === "total" && !totalDirty) {
      setTotalInput(String(override ?? liveAuto));
    }
  }

  async function saveTotal() {
    if (!target) return;

    const text = totalInput.trim();
    if (text === "") {
      toast.add({ title: "请输入本周总分", type: "error" });
      return;
    }
    const value = Number(text);
    if (!Number.isInteger(value) || value < 0) {
      toast.add({ title: "请输入不小于 0 的整数", type: "error" });
      return;
    }
    if (value > maxScore) {
      toast.add({ title: `分数不能超过满分 ${maxScore}`, type: "error" });
      return;
    }

    setSavingTotal(true);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.userId,
          groupId,
          weekStart: target.week,
          score: value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      onTotalSaved(target.userId, target.week, value);
      toast.add({ title: `已录入 ${value} 分（已锁定）`, type: "success" });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "保存失败",
        type: "error",
      });
    } finally {
      setSavingTotal(false);
    }
  }

  async function revertTotal() {
    if (!target) return;
    setSavingTotal(true);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.userId,
          groupId,
          weekStart: target.week,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "恢复失败");
      onTotalSaved(target.userId, target.week, null);
      toast.add({ title: "已恢复按自打卡汇总", type: "success" });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "恢复失败",
        type: "error",
      });
    } finally {
      setSavingTotal(false);
    }
  }

  async function toggleCell(item: EntryItem, date: string, next: boolean) {
    if (!target || !checked) return;
    const key = cellKeyOf(item.id, date);

    const previous = checked;
    const optimistic = new Set(checked);
    if (next) optimistic.add(key);
    else optimistic.delete(key);

    setBusyCell(key);
    setChecked(optimistic);

    try {
      const res = await fetch("/api/admin/records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.userId,
          itemId: item.id,
          date,
          checked: next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      onAutoChange(
        target.userId,
        target.week,
        computeAuto(items, days, optimistic)
      );
    } catch (error) {
      setChecked(previous);
      toast.add({
        title: error instanceof Error ? error.message : "保存失败",
        type: "error",
      });
    } finally {
      setBusyCell(null);
    }
  }

  const locked = override !== null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent size="xl" className="w-full gap-0">
        <SheetHeader>
          <SheetTitle>录入 · {target?.nickname ?? ""}</SheetTitle>
          <SheetDescription>
            {target ? formatWeekLabel(target.week) : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <ToggleGroup
            value={[mode]}
            onValueChange={(value) =>
              switchMode((value as string[])[0] === "grid" ? "grid" : "total")
            }
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="total" className={modeItemClass}>
              按总分
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" className={modeItemClass}>
              按表格
            </ToggleGroupItem>
          </ToggleGroup>

          {mode === "total" ? (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="week-total">本周总分</FieldLabel>
                <Input
                  id="week-total"
                  inputMode="numeric"
                  value={totalInput}
                  onChange={(event) => {
                    setTotalInput(event.target.value);
                    setTotalDirty(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      saveTotal();
                    }
                  }}
                  className="mx-auto h-12 max-w-xs text-center text-2xl font-semibold tabular-nums"
                />
                <FieldDescription>
                  当前自动 {liveAuto} 分 · 满分 {maxScore}
                  {locked ? ` · 已锁定为 ${override} 分` : ""}
                </FieldDescription>
              </Field>

              <div className="flex gap-2">
                <Button onClick={saveTotal} disabled={savingTotal}>
                  {savingTotal && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  保存
                </Button>
                {locked && (
                  <Button
                    variant="outline"
                    onClick={revertTotal}
                    disabled={savingTotal}
                  >
                    恢复自动
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {locked && (
                <Alert>
                  <AlertDescription>
                    本周已锁定为 {override} 分，按表格的改动不会改变周分；如需按打卡重算，请切到「按总分」点恢复自动。
                  </AlertDescription>
                </Alert>
              )}

              {checked === null ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((row) => (
                    <Skeleton key={row} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[72px] bg-card px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                          项目
                        </th>
                        {days.map((date) => (
                          <th
                            key={date}
                            className="bg-card px-0.5 py-1.5 text-center text-xs font-medium"
                          >
                            <div>{formatWeekdayShort(date)}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {formatMonthDay(date)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="sticky left-0 z-10 bg-card px-2 py-1 whitespace-nowrap">
                            <div className="text-sm">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.score}分
                            </div>
                          </td>
                          {days.map((date) => {
                            const on = checked.has(cellKeyOf(item.id, date));
                            const disabled =
                              date > today ||
                              !isAllowedOnDate(item.allowedWeekdays, date);
                            const busy = busyCell === cellKeyOf(item.id, date);

                            return (
                              <td key={date} className="px-0.5 py-1 text-center">
                                <button
                                  type="button"
                                  disabled={disabled || busy}
                                  aria-pressed={on}
                                  aria-label={`${item.name} ${formatMonthDay(date)}${on ? "取消打卡" : "打卡"}`}
                                  onClick={() => toggleCell(item, date, !on)}
                                  className={`mx-auto flex size-9 items-center justify-center rounded-md transition-colors ${
                                    on
                                      ? "bg-success-foreground text-white"
                                      : disabled
                                        ? "bg-transparent text-muted-foreground/40"
                                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                                  } ${disabled ? "cursor-not-allowed" : ""}`}
                                >
                                  {busy ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : on ? (
                                    <Check className="size-4" />
                                  ) : null}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">按表格合计</span>
                <span className="font-semibold tabular-nums">
                  {liveAuto} / {maxScore}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">点一下即保存</p>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
