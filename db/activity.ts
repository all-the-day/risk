import { prisma } from "@/lib/prisma";

export async function getTemplates() {
  return prisma.activityTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function getTemplateById(id: string) {
  return prisma.activityTemplate.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { children: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
}

export async function getTemplateItems(templateId: string) {
  return prisma.activityItem.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
    include: {
      children: { orderBy: { order: "asc" } },
      category: true,
    },
  });
}

export async function getTemplateFlatItems(templateId: string) {
  // Get all items with their category, organized for display
  const items = await prisma.activityItem.findMany({
    where: { templateId, parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: { orderBy: { order: "asc" } },
      category: true,
    },
  });

  // Group items by category
  const categorized = new Map<string | null, typeof items>();
  for (const item of items) {
    const key = item.categoryId;
    if (!categorized.has(key)) {
      categorized.set(key, []);
    }
    categorized.get(key)!.push(item);
  }

  return { items, categorized };
}

export async function getUserRecords(userId: string, date: string) {
  return prisma.activityRecord.findMany({
    where: { userId, date },
    include: {
      item: true,
    },
  });
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  maxScore: number;
  period?: string;
}) {
  return prisma.activityTemplate.create({ data });
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    maxScore?: number;
    period?: string;
  }
) {
  return prisma.activityTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(id: string) {
  return prisma.activityTemplate.delete({ where: { id } });
}

export async function createItem(data: {
  templateId: string;
  categoryId?: string;
  parentId?: string;
  name: string;
  fullName?: string;
  score: number;
  order?: number;
}) {
  return prisma.activityItem.create({
    data: {
      templateId: data.templateId,
      name: data.name,
      fullName: data.fullName || null,
      score: data.score,
      order: data.order ?? 0,
      categoryId: data.categoryId || null,
      parentId: data.parentId || null,
    },
  });
}

export async function updateItem(
  id: string,
  data: {
    name?: string;
    fullName?: string;
    score?: number;
    order?: number;
    enabled?: boolean;
    categoryId?: string | null;
    parentId?: string | null;
  }
) {
  return prisma.activityItem.update({ where: { id }, data });
}

export async function deleteItem(id: string) {
  return prisma.activityItem.delete({ where: { id } });
}

export async function createCategory(data: {
  templateId: string;
  name: string;
  order?: number;
}) {
  return prisma.activityCategory.create({
    data: {
      templateId: data.templateId,
      name: data.name,
      order: data.order ?? 0,
    },
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; order?: number }
) {
  return prisma.activityCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.activityCategory.delete({ where: { id } });
}
