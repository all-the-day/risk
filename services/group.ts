import { prisma } from "@/lib/prisma";
import { getEnabledItems } from "@/db/activity";
import { isAllowedOnDate } from "@/lib/date";

export type MemberDaily = {
  userId: string;
  nickname: string;
  done: number;
};

// 本家今日完成情况：按成员统计当天已打卡的项目数
export async function getGroupDailyStatus(groupId: string, date: string) {
  const enabled = await getEnabledItems();
  if (enabled.length === 0) return null;

  // 当天可打卡的项目（只主日打的项目，平时不计入分母）
  const leaves = enabled.filter((item) =>
    isAllowedOnDate(item.allowedWeekdays, date)
  );
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, nickname: true },
  });

  const records = await prisma.activityRecord.findMany({
    where: {
      userId: { in: members.map((m) => m.userId) },
      date,
      itemId: { in: leaves.map((i) => i.id) },
    },
    select: { userId: true },
  });

  const countByUser = new Map<string, number>();
  for (const record of records) {
    countByUser.set(record.userId, (countByUser.get(record.userId) ?? 0) + 1);
  }

  const total = leaves.length;
  const list: MemberDaily[] = members.map((m) => ({
    userId: m.userId,
    nickname: m.nickname,
    done: countByUser.get(m.userId) ?? 0,
  }));

  return {
    members: list,
    total,
    allDone: total > 0 && list.every((m) => m.done === total),
  };
}
