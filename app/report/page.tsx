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
    <div className="min-h-screen pb-20">
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">周表</h1>
          <p className="text-sm text-muted-foreground">
            {membership.group.name}
            {table ? ` · ${table.templateName}` : ""}
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {table ? (
          <ReportClient
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
