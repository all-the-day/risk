import { prisma } from "@/lib/prisma";
import { getEnabledItems } from "@/db/activity";
import { createRecord, deleteRecord } from "@/db/record";
import { formatAllowedWeekdays, isAllowedOnDate } from "@/lib/date";
import { maxScoreOf } from "@/lib/score";

export type ChecklistItem = {
  id: string;
  name: string;
  score: number;
  checksPerWeek: number;
  scope: string;
};

type Item = Awaited<ReturnType<typeof getEnabledItems>>[number];

function toItem(item: Item): ChecklistItem {
  return {
    id: item.id,
    name: item.name,
    score: item.score,
    checksPerWeek: item.checksPerWeek,
    scope: item.scope,
  };
}

// 打卡页清单：启用 + 今天可以打卡
export async function getDailyChecklist(userId: string, date: string) {
  const items = await getEnabledItems();
  if (items.length === 0) return null;

  const records = await prisma.activityRecord.findMany({
    where: { userId, date },
    select: { itemId: true },
  });

  return {
    maxScore: maxScoreOf(items),
    items: items
      .filter((item) => isAllowedOnDate(item.allowedWeekdays, date))
      .map(toItem),
    checkedItemIds: records.map((record) => record.itemId),
  };
}

// 打勾 / 取消（服务端再校验一次：启用 + 今天可打卡）
export async function toggleChecklistItem(
  userId: string,
  itemId: string,
  date: string
) {
  const item = await prisma.activityItem.findUnique({
    where: { id: itemId },
    select: { enabled: true, allowedWeekdays: true },
  });
  if (!item) return { error: "项目不存在" };
  if (!item.enabled) return { error: "该项目已停用" };
  if (!isAllowedOnDate(item.allowedWeekdays, date)) {
    return {
      error: `该项目仅限${formatAllowedWeekdays(item.allowedWeekdays)}打卡`,
    };
  }

  const removed = await deleteRecord(userId, itemId, date);
  if (removed) return { checked: false };

  await createRecord(userId, itemId, date);
  return { checked: true };
}
