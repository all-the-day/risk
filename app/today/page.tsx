import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTodayString } from "@/lib/date";
import { getDailyChecklist } from "@/services/activity";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const checklist = await getDailyChecklist(user.id, getTodayString());

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
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
