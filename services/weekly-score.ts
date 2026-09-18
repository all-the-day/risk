import { prisma } from "@/lib/prisma";
import { getEnabledItems } from "@/db/activity";
import { getRecordsInRange } from "@/db/record";
import { getScoresInRange } from "@/db/weekly-score";
import { earnedCenti, displayScore, sumCenti, maxScoreOf } from "@/lib/score";
import { getWeekEnd, getWeekStartOf } from "@/lib/date";

export type CellScore = {
  auto: number; // 自打卡汇总
  override: number | null; // 管理员录入（存在即优先）
  score: number; // 有效分
};

export type MemberWeekRow = {
  userId: string;
  nickname: string;
  byWeek: Record<string, CellScore>;
};

export type WeeklyTable = {
  maxScore: number;
  weeks: string[];
  members: MemberWeekRow[];
};

const cellKey = (userId: string, week: string) => `${userId}|${week}`;

// 自打卡汇总：本周每项次数 × 单次得分（按 checksPerWeek 封顶）
export function computeAutoScore(
  counts: Map<string, number>,
  userId: string,
  week: string,
  leaves: { id: string; score: number; checksPerWeek: number }[]
): number {
  const centi = sumCenti(
    leaves.map((item) =>
      earnedCenti(counts.get(`${userId}|${item.id}|${week}`) ?? 0, item.score, item.checksPerWeek)
    )
  );
  return displayScore(centi);
}

export async function getWeeklyTable(
  groupId: string,
  weeks: string[]
): Promise<WeeklyTable | null> {
  if (weeks.length === 0) return null;

  const leaves = await getEnabledItems();
  if (leaves.length === 0) return null;

  const maxScore = maxScoreOf(leaves);
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, nickname: true },
  });
  const userIds = members.map((m) => m.userId);

  const from = weeks[0];
  const to = getWeekEnd(weeks[weeks.length - 1]);
  const [records, overrides] = await Promise.all([
    userIds.length ? getRecordsInRange(userIds, from, to) : [],
    userIds.length ? getScoresInRange(userIds, weeks) : [],
  ]);

  // 次数：按 人 + 项目 + 周 统计（一条记录 = 当天一次）
  const counts = new Map<string, number>();
  for (const record of records) {
    const week = getWeekStartOf(record.date);
    if (!weeks.includes(week)) continue;
    const key = `${record.userId}|${record.itemId}|${week}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const overrideMap = new Map<string, number>();
  for (const score of overrides) {
    overrideMap.set(cellKey(score.userId, score.weekStart), score.score);
  }

  const rows: MemberWeekRow[] = members.map((member) => {
    const byWeek: Record<string, CellScore> = {};
    for (const week of weeks) {
      const auto = computeAutoScore(counts, member.userId, week, leaves);
      const override = overrideMap.get(cellKey(member.userId, week)) ?? null;
      byWeek[week] = { auto, override, score: override ?? auto };
    }
    return { userId: member.userId, nickname: member.nickname, byWeek };
  });

  return {
    maxScore,
    weeks,
    members: rows,
  };
}
