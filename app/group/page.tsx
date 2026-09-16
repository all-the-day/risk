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
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
        {status ? (
          <GroupClient
            groupName={membership.group.name}
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
