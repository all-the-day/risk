import { prisma } from "@/lib/prisma";

// 全部未删除项目（管理端用，含停用项，按显示顺序）
export async function getItems() {
  return prisma.activityItem.findMany({
    where: { deletedAt: null },
    orderBy: { order: "asc" },
  });
}

// 已软删除的项目（回收站）
export async function getDeletedItems() {
  return prisma.activityItem.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
}

// 启用中且未删除的项目（打卡页、周表、满分计算都用它）
export async function getEnabledItems() {
  return prisma.activityItem.findMany({
    where: { enabled: true, deletedAt: null },
    orderBy: { order: "asc" },
  });
}
