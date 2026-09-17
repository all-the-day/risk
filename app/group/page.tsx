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
  const canSeeAll = membership.role === "leader" || user.isAdmin;
  const status = await getGroupDailyStatus(
    membership.groupId,
    getTodayString()
  );

  // 成员只能看到自己的完成情况；团长与全局管理员看全员
  const members = status
    ? canSeeAll
      ? status.members
      : status.members.filter((m) => m.userId === user.id)
    : [];
  const allDone =
    status != null &&
    members.length > 0 &&
    members.every((m) => m.done === status.total);

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
        {status ? (
          <>
            {!canSeeAll && (
              <p className="text-xs text-muted-foreground mb-2">
                成员仅可见自己的完成情况，全家的由团长查看
              </p>
            )}
            <GroupClient
              groupName={membership.group.name}
              members={members}
              total={status.total}
              allDone={allDone}
            />
          </>
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
