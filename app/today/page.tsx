import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTodayString, formatDisplayDate } from "@/lib/date";
import { getDailyChecklist } from "@/services/activity";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const checklist = await getDailyChecklist(user.id, getTodayString());
  const displayDate = formatDisplayDate(new Date());

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">{displayDate}</p>
          <h1 className="text-xl font-bold">今日功课</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {checklist ? (
          <TodayClient
            rows={checklist.rows}
            checkedItemIds={checklist.checkedItemIds}
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
