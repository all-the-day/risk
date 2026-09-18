"use client";

import { useState } from "react";
import ItemCheckButton from "@/components/ItemCheckButton";
import BottomNav from "@/components/BottomNav";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ChecklistItem {
  id: string;
  name: string;
  score: number;
  checksPerWeek: number;
  scope: string;
}

interface TodayClientProps {
  items: ChecklistItem[];
  checkedItemIds: string[];
}

export default function TodayClient({
  items,
  checkedItemIds: initialChecked,
}: TodayClientProps) {
  const [checked, setChecked] = useState<string[]>(initialChecked);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(itemId: string, nextChecked: boolean) {
    setError(null);
    setChecked((prev) =>
      nextChecked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );
  }

  const done = items.filter((item) => checked.includes(item.id)).length;
  const total = items.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  return (
    <>
      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>今日项目</CardTitle>
            <CardAction>
              <Badge
                variant={allDone ? "default" : "secondary"}
                className={allDone ? "bg-success text-success-foreground" : ""}
              >
                {done}/{total}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  allDone ? "bg-success-foreground" : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col">
              {items.map((item, index) => {
                const isChecked = checked.includes(item.id);
                return (
                  <div key={item.id}>
                    {index > 0 && <Separator className="my-0" />}
                    <div className="flex items-center justify-between py-2.5">
                      <span
                        className={`text-sm ${
                          isChecked
                            ? "text-muted-foreground/60 line-through"
                            : "text-foreground"
                        }`}
                      >
                        {item.name}
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
              今日项目已全部完成
            </p>
          </CardContent>
        </Card>
      )}

      <BottomNav />
    </>
  );
}
