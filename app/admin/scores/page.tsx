import { prisma } from "@/lib/prisma";
import { getEnabledItems } from "@/db/activity";
import { getRecentWeeks } from "@/lib/date";
import { getWeeklyTable } from "@/services/weekly-score";
import ScoreGridClient from "./ScoreGridClient";

export default async function AdminScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;

  const groups = await prisma.group.findMany({
    where: { disabled: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有家。请先在前台创建或加入一个家。
      </p>
    );
  }

  const items = await getEnabledItems();
  const current = groups.find((item) => item.id === group) ?? groups[0];
  const table = await getWeeklyTable(current.id, getRecentWeeks(6));
  if (!table) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有配置项目，请先到「项目管理」添加。
      </p>
    );
  }

  return (
    <ScoreGridClient
      groups={groups}
      groupId={current.id}
      weeks={table.weeks}
      members={table.members}
      maxScore={table.maxScore}
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        score: item.score,
        checksPerWeek: item.checksPerWeek,
        allowedWeekdays: item.allowedWeekdays,
      }))}
    />
  );
}
