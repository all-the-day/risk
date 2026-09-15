import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTodayString } from "@/lib/date";
import { getGroupDailyStatus } from "@/services/group";
import GroupClient from "./GroupClient";
import BottomNav from "@/components/BottomNav";

export default async function GroupPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const membership = user.memberships[0];
  const status = await getGroupDailyStatus(
    membership.groupId,
    getTodayString()
  );

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">{membership.group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {status ? `${status.members.length} 人 · 每日 ${status.total} 项` : "暂无事项模板"}
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {status ? (
          <GroupClient
            members={status.members}
            total={status.total}
            allDone={status.allDone}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            管理员还没有启用事项模板，请稍后再来。
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
