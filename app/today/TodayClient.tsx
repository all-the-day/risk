"use client";

import { useMemo, useState } from "react";
import ItemCheckButton from "@/components/ItemCheckButton";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ChecklistItem {
  id: string;
  name: string;
  fullName: string | null;
  score: number;
  checksPerWeek: number;
}

type Row =
  | { kind: "item"; item: ChecklistItem }
  | { kind: "header"; title: string; itemIds: string[] };

interface TodayClientProps {
  rows: Row[];
  checkedItemIds: string[];
  error?: string;
}

export default function TodayClient({
  rows,
  checkedItemIds: initialChecked,
}: TodayClientProps) {
  const [checked, setChecked] = useState<string[]>(initialChecked);
  const [error, setError] = useState<string | null>(null);

  const leafItems = useMemo(
    () => rows.flatMap((row) => (row.kind === "item" ? [row.item] : [])),
    [rows]
  );

  function handleToggle(itemId: string, nextChecked: boolean) {
    setError(null);
    setChecked((prev) =>
      nextChecked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );
  }

  const done = leafItems.filter((item) => checked.includes(item.id)).length;
  const total = leafItems.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  return (
    <>
      <section className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">今日事项</h2>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      allDone ? "bg-success-foreground" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <Badge variant="secondary" className="text-[11px]">
                  {done}/{total}
                </Badge>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mb-2">{error}</p>
            )}

            <div className="flex flex-col">
              {rows.map((row, index) => {
                if (row.kind === "header") {
                  const subDone = row.itemIds.filter((id) =>
                    checked.includes(id)
                  ).length;
                  return (
                    <div
                      key={`header-${row.title}`}
                      className={`flex items-center justify-between py-2 ${
                        index > 0 ? "border-t mt-2" : ""
                      }`}
                    >
                      <span className="text-sm font-medium">{row.title}</span>
                      {row.itemIds.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {subDone}/{row.itemIds.length}
                        </span>
                      )}
                    </div>
                  );
                }

                const item = row.item;
                const isChecked = checked.includes(item.id);
                return (
                  <div key={item.id}>
                    {index > 0 && rows[index - 1].kind === "item" && (
                      <Separator className="my-0" />
                    )}
                    <div className="flex items-center justify-between py-2.5">
                      <span
                        className={`text-sm ${
                          isChecked
                            ? "text-muted-foreground/60 line-through"
                            : "text-foreground"
                        }`}
                      >
                        {item.name}
                        {item.fullName && item.fullName !== item.name && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            {item.fullName}
                          </span>
                        )}
                        {item.checksPerWeek > 1 && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            周 {item.checksPerWeek} 次
                          </span>
                        )}
                      </span>
                      <ItemCheckButton
                        itemId={item.id}
                        checked={isChecked}
                        onToggle={handleToggle}
                        onError={setError}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {allDone && (
        <Card className="bg-success/30 border-success/30 mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-success-foreground font-medium">
              今日事项已全部完成
            </p>
          </CardContent>
        </Card>
      )}

      <BottomNav />
    </>
  );
}
