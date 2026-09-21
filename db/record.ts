import { prisma } from "@/lib/prisma";

// 某人在某天已打卡的项目 id
export async function getCheckedItemIds(userId: string, date: string) {
  const records = await prisma.activityRecord.findMany({
    where: { userId, date },
    select: { itemId: true },
  });
  return records.map((r) => r.itemId);
}

export async function createRecord(userId: string, itemId: string, date: string) {
  return prisma.activityRecord.create({ data: { userId, itemId, date } });
}

// 幂等写入：已打卡时保持原样（管理员代录用，重复提交不报错）
export async function upsertRecord(userId: string, itemId: string, date: string) {
  return prisma.activityRecord.upsert({
    where: { userId_itemId_date: { userId, itemId, date } },
    update: {},
    create: { userId, itemId, date },
  });
}

// 返回是否删掉了记录（没打过卡时为 false）
export async function deleteRecord(userId: string, itemId: string, date: string) {
  const result = await prisma.activityRecord.deleteMany({
    where: { userId, itemId, date },
  });
  return result.count > 0;
}

// 一批人在日期区间内的打卡记录（周汇总用）
export async function getRecordsInRange(
  userIds: string[],
  from: string,
  to: string
) {
  return prisma.activityRecord.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: from, lte: to },
    },
    select: { userId: true, itemId: true, date: true },
  });
}
