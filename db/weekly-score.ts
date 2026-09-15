import { prisma } from "@/lib/prisma";

// 管理员录入的周总分：行存在即代表覆盖自打卡汇总
export async function getScoresInRange(
  userIds: string[],
  weeks: string[]
) {
  return prisma.weeklyScore.findMany({
    where: { userId: { in: userIds }, weekStart: { in: weeks } },
    select: { userId: true, weekStart: true, score: true },
  });
}

export async function upsertScore(data: {
  userId: string;
  groupId: string;
  weekStart: string;
  score: number;
  updatedById: string;
}) {
  return prisma.weeklyScore.upsert({
    where: {
      userId_groupId_weekStart: {
        userId: data.userId,
        groupId: data.groupId,
        weekStart: data.weekStart,
      },
    },
    update: { score: data.score, updatedById: data.updatedById },
    create: data,
  });
}

// 恢复自动：删掉覆盖记录
export async function deleteScore(
  userId: string,
  groupId: string,
  weekStart: string
) {
  const result = await prisma.weeklyScore.deleteMany({
    where: { userId, groupId, weekStart },
  });
  return result.count > 0;
}
