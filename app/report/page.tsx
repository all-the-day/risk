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
  const table = await getWeeklyTable(membership.groupId, getRecentWeeks(8));

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
        {table ? (
          <ReportClient
            groupName={membership.group.name}
            weeks={table.weeks}
            members={table.members}
            maxScore={table.maxScore}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            管理员还没有启用事项模板，请稍后再来。
          </p>
        )}
      </main>
    </div>
  );
}
