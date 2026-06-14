import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWeekString, formatWeekLabel } from "@/lib/date";
import ReportClient from "./ReportClient";

export default async function ReportPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const weekStr = getWeekString();
  const weekLabel = formatWeekLabel(weekStr);

  // Get all scored tasks (score > 0 means they have scoring)
  const tasks = await prisma.task.findMany({
    where: { enabled: true, score: { gt: 0 } },
    orderBy: { order: "asc" },
  });

  // Get this week's checkins for the user
  const checkins = await prisma.checkin.findMany({
    where: {
      userId: session.userId,
      taskId: { in: tasks.map((t) => t.id) },
    },
  });

  // Group checkins by taskId
  const checkinMap: Record<string, string[]> = {};
  for (const c of checkins) {
    if (!checkinMap[c.taskId]) checkinMap[c.taskId] = [];
    if (!checkinMap[c.taskId].includes(c.date)) {
      checkinMap[c.taskId].push(c.date);
    }
  }

  // Calculate scores
  let totalScore = 0;
  const items = tasks.map((task) => {
    const checkedDays = checkinMap[task.id]?.length ?? 0;
    const checksPerWeek = task.checksPerWeek || 1;
    const scorePerCheck = task.score / checksPerWeek;
    const earned = Math.min(checkedDays, checksPerWeek) * scorePerCheck;
    totalScore += earned;

    return {
      id: task.id,
      name: task.title,
      maxScore: task.score,
      checksPerWeek,
      checkedDays,
      earned,
    };
  });

  return (
    <ReportClient
      weekLabel={weekLabel}
      items={JSON.parse(JSON.stringify(items))}
      totalScore={totalScore}
      maxTotalScore={tasks.reduce((sum, t) => sum + t.score, 0)}
    />
  );
}
