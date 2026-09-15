import { prisma } from "@/lib/prisma";
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

  const current = groups.find((g) => g.id === group) ?? groups[0];
  const table = await getWeeklyTable(current.id, getRecentWeeks(6));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">周分录入</h1>
        <p className="text-sm text-muted-foreground mt-1">
          默认按成员自打卡汇总；管理员录入后覆盖并锁定，可随时恢复自动。
        </p>
      </div>

      {table ? (
        <ScoreGridClient
          groups={groups}
          groupId={current.id}
          weeks={table.weeks}
          members={table.members}
          maxScore={table.maxScore}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          还没有启用的事项模板，请先到「事项模板」启用一个。
        </p>
      )}
    </div>
  );
}
