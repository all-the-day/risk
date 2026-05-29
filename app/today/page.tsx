import { redirect } from "next/navigation";
import { requireUser } from "@/db/user";
import { getUserCheckinStatus } from "@/services/checkin";
import { getTodayString, formatDisplayDate } from "@/lib/date";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const checkinStatus = await getUserCheckinStatus(user.id);
  const today = getTodayString();
  const displayDate = formatDisplayDate(new Date());

  const groupTasks = checkinStatus.filter((t: { taskType: string }) => t.taskType === "group");
  const personalTasks = checkinStatus.filter((t: { taskType: string }) => t.taskType === "personal");

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500">{displayDate}</p>
          <h1 className="text-xl font-bold">今日功课</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <TodayClient
          groupTasks={groupTasks}
          personalTasks={personalTasks}
          date={today}
        />
      </main>
    </div>
  );
}
