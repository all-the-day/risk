import { prisma } from "@/lib/prisma";
import { getActiveTemplate } from "@/db/activity";
import { createRecord, deleteRecord } from "@/db/record";

export type ChecklistItem = {
  id: string;
  name: string;
  fullName: string | null;
  score: number;
  checksPerWeek: number;
};

// 打卡页的行：叶子项可点，分组标题（父项 / 分类）只作分隔
export type ChecklistRow =
  | { kind: "item"; item: ChecklistItem }
  | { kind: "header"; title: string; itemIds: string[] };

type TemplateWithItems = NonNullable<Awaited<ReturnType<typeof getActiveTemplate>>>;
type RawItem = TemplateWithItems["items"][number];

function toLeaf(item: RawItem): ChecklistItem {
  return {
    id: item.id,
    name: item.name,
    fullName: item.fullName,
    score: item.score,
    checksPerWeek: item.checksPerWeek,
  };
}

// 有子项的即为父项：父项不参与打卡与计分（其分值为子项之和）
function groupChildren(items: RawItem[]) {
  const map = new Map<string, RawItem[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    map.set(item.parentId, [...(map.get(item.parentId) ?? []), item]);
  }
  return map;
}

// 可打卡、可计分的叶子项（父项与停用项都排除）
export function getActiveLeaves(template: TemplateWithItems): TemplateWithItems["items"] {
  const parentIds = new Set(
    template.items.filter((i) => i.parentId).map((i) => i.parentId)
  );
  return template.items.filter((i) => i.enabled && !parentIds.has(i.id));
}

export function buildChecklistRows(template: TemplateWithItems): ChecklistRow[] {
  const enabledItems = template.items.filter((i) => i.enabled);
  const childrenOf = groupChildren(template.items);
  const rows: ChecklistRow[] = [];

  const pushItem = (item: RawItem, out: ChecklistRow[]) => {
    const enabledChildren = (childrenOf.get(item.id) ?? []).filter((c) => c.enabled);
    if (enabledChildren.length > 0) {
      out.push({
        kind: "header",
        title: item.name,
        itemIds: enabledChildren.map((c) => c.id),
      });
      for (const child of enabledChildren) out.push({ kind: "item", item: toLeaf(child) });
    } else {
      out.push({ kind: "item", item: toLeaf(item) });
    }
  };

  // 未分类的顶层项（保持模板里的排序）
  const topItems = enabledItems.filter((i) => i.parentId === null);
  for (const item of topItems.filter((i) => !i.categoryId)) {
    pushItem(item, rows);
  }

  // 分类分组
  for (const category of template.categories) {
    const grouped = topItems.filter((i) => i.categoryId === category.id);
    if (grouped.length === 0) continue;

    const inner: ChecklistRow[] = [];
    for (const item of grouped) pushItem(item, inner);
    const itemIds = inner.flatMap((row) =>
      row.kind === "item" ? [row.item.id] : row.itemIds
    );
    rows.push({ kind: "header", title: category.name, itemIds });
    rows.push(...inner);
  }

  return rows;
}

export async function getDailyChecklist(userId: string, date: string) {
  const template = await getActiveTemplate();
  if (!template) return null;

  const records = await prisma.activityRecord.findMany({
    where: { userId, date },
    select: { itemId: true },
  });

  return {
    templateName: template.name,
    maxScore: template.maxScore,
    rows: buildChecklistRows(template),
    checkedItemIds: records.map((r) => r.itemId),
  };
}

// 打勾 / 取消（含"必须是当前模板下的启用叶子项"校验）
export async function toggleChecklistItem(
  userId: string,
  itemId: string,
  date: string
) {
  const item = await prisma.activityItem.findUnique({
    where: { id: itemId },
    select: {
      enabled: true,
      templateId: true,
      _count: { select: { children: true } },
    },
  });
  if (!item) return { error: "事项不存在" };
  if (!item.enabled) return { error: "该事项已停用" };
  if (item._count.children > 0) return { error: "父项不可打卡" };

  const template = await prisma.activityTemplate.findUnique({
    where: { id: item.templateId },
    select: { enabled: true },
  });
  if (!template?.enabled) return { error: "当前没有启用的事项模板" };

  const removed = await deleteRecord(userId, itemId, date);
  if (removed) return { checked: false };

  await createRecord(userId, itemId, date);
  return { checked: true };
}
