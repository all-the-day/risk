"use client";

import { Card, CardContent } from "@/components/ui/card";
import { percent } from "@/lib/score";
import { formatWeekChip } from "@/lib/date";
import type { MemberWeekRow } from "@/services/weekly-score";

interface MemberCardsProps {
  members: MemberWeekRow[];
  weeks: string[];
  currentWeek: string;
  maxScore: number;
}

export default function MemberCards({
  members,
  weeks,
  currentWeek,
  maxScore,
}: MemberCardsProps) {
  const showTrend = weeks.length > 1;

  return (
    <div className="flex flex-col gap-2.5">
      {members.map((member) => {
        const score = member.byWeek[currentWeek]?.score ?? 0;
        const pct = percent(score, maxScore);
        const full = maxScore > 0 && score >= maxScore;

        return (
          <Card key={member.userId}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-8.5 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    full
                      ? "bg-success text-success-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {member.nickname.slice(0, 1)}
                </div>
                <span className="flex-1 font-medium">{member.nickname}</span>
                <span className="text-xl font-bold tracking-tight">
                  {score}
                  <span className="text-xs font-medium text-muted-foreground">
                    /{maxScore}
                  </span>
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    full ? "bg-success-foreground" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {showTrend && (
                <div className="mt-3 flex items-end gap-1.5" data-trend="true">
                  {weeks.map((week) => {
                    const value = member.byWeek[week]?.score ?? 0;
                    const valuePct = percent(value, maxScore);
                    const isFull = maxScore > 0 && value >= maxScore;
                    return (
                      <div
                        key={week}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="flex h-6 w-full items-end overflow-hidden rounded bg-muted/70">
                          <div
                            className={`w-full rounded-t ${
                              isFull ? "bg-success-foreground" : "bg-primary"
                            }`}
                            style={{ height: `${valuePct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatWeekChip(week)}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            isFull ? "text-success-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
