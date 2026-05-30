import { redirect } from "next/navigation";
import { requireUser } from "@/db/user";
import { getGroupDailyStatus } from "@/services/checkin";
import GroupClient from "./GroupClient";
import BottomNav from "@/components/BottomNav";

export default async function GroupPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const membership = user.memberships[0];
  const groupStatus = await getGroupDailyStatus(membership.groupId);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">{groupStatus.groupName}</h1>
          <p className="text-sm text-gray-500">
            {groupStatus.totalMembers} 人 · {groupStatus.totalTasks} 项
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <GroupClient
          taskStatus={groupStatus.taskStatus}
          allDone={groupStatus.allDone}
        />
      </main>

      <BottomNav />
    </div>
  );
}
