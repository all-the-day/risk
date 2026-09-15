"use client";

import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportItem {
  id: string;
  name: string;
  maxScore: number;
  checksPerWeek: number;
  checkedDays: number;
  earned: number;
}

interface ReportClientProps {
  weekLabel: string;
  items: ReportItem[];
  totalScore: number;
  maxTotalScore: number;
}

export default function ReportClient({
  weekLabel,
  items,
  totalScore,
  maxTotalScore,
}: ReportClientProps) {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold">周报告</h1>
          <p className="text-sm text-muted-foreground mt-1">{weekLabel}</p>

          {/* Score overview */}
          <Card className="mt-4">
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {totalScore}
                </span>
                <span className="text-base text-muted-foreground">
                  / {maxTotalScore} 分
                </span>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{
                    width:
                      maxTotalScore > 0
                        ? `${(totalScore / maxTotalScore) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                暂无评分项目，请先在管理后台启用活动模板。
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const isDaily = item.checksPerWeek > 1;
              const pct =
                item.maxScore > 0
                  ? Math.round((item.earned / item.maxScore) * 100)
                  : 0;
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge
                            variant="secondary"
                            className="text-[11px] px-1.5 py-0"
                          >
                            {isDaily
                              ? `每天×${item.checksPerWeek}次`
                              : "每周1次"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-xl font-bold text-primary">
                          {item.earned}
                        </span>
                        <span className="text-xs text-muted-foreground ml-0.5">
                          /{item.maxScore}
                        </span>
                      </div>
                    </div>

                    {/* Mini progress */}
                    <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      已打卡 {item.checkedDays}/{item.checksPerWeek} 次
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
