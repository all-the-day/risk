"use client";

import { formatWeekChip } from "@/lib/date";
import type { MemberWeekRow } from "@/services/weekly-score";

interface MemberTableProps {
  members: MemberWeekRow[];
  weeks: string[];
  maxScore: number;
}

export default function MemberTable({
  members,
  weeks,
  maxScore,
}: MemberTableProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border-b bg-card px-3 py-2 text-left text-xs font-semibold">
                成员
              </th>
              {weeks.map((week) => (
                <th
                  key={week}
                  className="border-b bg-card px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap"
                >
                  {formatWeekChip(week)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="group">
                <td className="sticky left-0 z-10 border-b bg-card px-3 py-2 font-medium whitespace-nowrap shadow-[1px_0_0_var(--border)] group-hover:bg-muted/40">
                  {member.nickname}
                </td>
                {weeks.map((week) => {
                  const score = member.byWeek[week]?.score ?? 0;
                  const full = maxScore > 0 && score >= maxScore;
                  return (
                    <td
                      key={week}
                      className={`border-b px-3 py-2 text-right tabular-nums group-hover:bg-muted/40 ${
                        full
                          ? "font-semibold text-success-foreground"
                          : score === 0
                            ? "text-muted-foreground"
                            : ""
                      }`}
                    >
                      {score}
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
              {weeks.map((week) => {
                const sum = members.reduce(
                  (total, member) => total + (member.byWeek[week]?.score ?? 0),
                  0
                );
                return (
                  <td
                    key={week}
                    className="bg-muted px-3 py-2 text-right text-xs font-semibold tabular-nums"
                  >
                    {sum}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        横向滑动查看其他周次，姓名列固定不动
      </p>
    </div>
  );
}
