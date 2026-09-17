import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRecentWeeks } from "@/lib/date";
import { getWeeklyTable } from "@/services/weekly-score";
import ReportClient from "./ReportClient";

export default async function ReportPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const membership = user.memberships[0];
  const canSeeAll = membership.role === "leader" || user.isAdmin;
  const table = await getWeeklyTable(membership.groupId, getRecentWeeks(8));

  // 成员只能看到自己的周分；团长与全局管理员看全表
  const members = table
    ? canSeeAll
      ? table.members
      : table.members.filter((m) => m.userId === user.id)
    : [];

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
        {table ? (
          <>
            {!canSeeAll && (
              <p className="text-xs text-muted-foreground mb-2">
                成员仅可见自己的周分，完整周表由团长查看
              </p>
            )}
            <ReportClient
              groupName={membership.group.name}
              weeks={table.weeks}
              members={members}
              maxScore={table.maxScore}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            管理员还没有启用事项模板，请稍后再来。
          </p>
        )}
      </main>
    </div>
  );
}
