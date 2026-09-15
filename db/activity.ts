import { prisma } from "@/lib/prisma";

export async function getTemplates() {
  return prisma.activityTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });
}

// 当前启用的模板（含分类与全部事项，供打卡页与周表使用）
export async function getActiveTemplate() {
  return prisma.activityTemplate.findFirst({
    where: { enabled: true },
    include: {
      categories: { orderBy: { order: "asc" } },
      items: { orderBy: { order: "asc" } },
    },
  });
}

export async function getItemWithTemplate(itemId: string) {
  return prisma.activityItem.findUnique({
    where: { id: itemId },
    include: { template: { select: { id: true, enabled: true } } },
  });
}
