"use client";

import { formatWeekChip } from "@/lib/date";
import type { MemberWeekRow } from "@/services/weekly-score";

interface MemberChartProps {
  members: MemberWeekRow[];
  weeks: string[];
  maxScore: number;
  type: "bar" | "line";
}

// 5 种够区分的系列色（在浅色底上都能看清）
const SERIES_COLORS = [
  "oklch(0.586 0.213 263)", // 蓝
  "oklch(0.60 0.14 155)", // 绿
  "oklch(0.70 0.15 65)", // 橙
  "oklch(0.58 0.19 305)", // 紫
  "oklch(0.65 0.12 195)", // 青
];

const PAD = { top: 14, right: 10, bottom: 26, left: 34 };
const PLOT_HEIGHT = 170;
const WEEK_WIDTH = 72; // 每周占的横向宽度（人多了好读）

export default function MemberChart({
  members,
  weeks,
  maxScore,
  type,
}: MemberChartProps) {
  const width = PAD.left + PAD.right + WEEK_WIDTH * weeks.length;
  const height = PAD.top + PLOT_HEIGHT + PAD.bottom;
  const plotBottom = PAD.top + PLOT_HEIGHT;

  // 统一刻度 0..满分（small multiples 的"共用刻度"原则）
  const y = (value: number) => plotBottom - (Math.min(value, maxScore) / maxScore) * PLOT_HEIGHT;

  function colorOf(index: number) {
    return SERIES_COLORS[index % SERIES_COLORS.length];
  }

  const weekCenterX = (weekIndex: number) =>
    PAD.left + WEEK_WIDTH * weekIndex + WEEK_WIDTH / 2;

  const gridValues = [0, Math.round(maxScore / 2), maxScore];

  return (
    <div>
      <div className="overflow-x-auto rounded-xl bg-card p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`本家各成员每周得分${type === "bar" ? "柱状图" : "折线图"}`}
        >
          {/* 网格线与 Y 轴刻度 */}
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(value)}
                y2={y(value)}
                stroke="var(--border)"
                strokeDasharray={value === maxScore ? "4 3" : undefined}
              />
              <text
                x={PAD.left - 6}
                y={y(value) + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {value}
              </text>
            </g>
          ))}

          {/* 周标签 */}
          {weeks.map((week, index) => (
            <text
              key={week}
              x={weekCenterX(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted-foreground)"
            >
              {formatWeekChip(week)}
            </text>
          ))}

          {/* 柱状模式：每周一组，一人一根 */}
          {type === "bar" &&
            weeks.map((week, weekIndex) => {
              const groupWidth = WEEK_WIDTH - 18;
              const barWidth = groupWidth / members.length;
              return members.map((member, memberIndex) => {
                const value = member.byWeek[week]?.score ?? 0;
                const barHeight = Math.max(plotBottom - y(value), value > 0 ? 2 : 0);
                return (
                  <rect
                    key={`${week}-${member.userId}`}
                    x={weekCenterX(weekIndex) - groupWidth / 2 + barWidth * memberIndex + 1}
                    y={plotBottom - barHeight}
                    width={Math.max(barWidth - 2, 1)}
                    height={barHeight}
                    rx="2"
                    fill={colorOf(memberIndex)}
                  />
                );
              });
            })}

          {/* 折线模式：一人一条 */}
          {type === "line" &&
            members.map((member, memberIndex) => {
              const points = weeks
                .map((week, index) => {
                  const value = member.byWeek[week]?.score ?? 0;
                  return `${weekCenterX(index)},${y(value)}`;
                })
                .join(" ");
              return (
                <g key={member.userId}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={colorOf(memberIndex)}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {weeks.map((week, index) => {
                    const value = member.byWeek[week]?.score ?? 0;
                    return (
                      <circle
                        key={week}
                        cx={weekCenterX(index)}
                        cy={y(value)}
                        r="3"
                        fill="var(--card)"
                        stroke={colorOf(memberIndex)}
                        strokeWidth="2"
                      />
                    );
                  })}
                </g>
              );
            })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {members.map((member, index) => (
          <span key={member.userId} className="flex items-center gap-1.5 text-xs">
            <i
              className="inline-block size-2.5 rounded-full"
              style={{ background: colorOf(index) }}
            />
            {member.nickname}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">满分 {maxScore}</span>
      </div>
    </div>
  );
}
