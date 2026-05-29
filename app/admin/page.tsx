import { prisma } from "@/lib/prisma";
import { getTodayString } from "@/lib/date";

export default async function AdminDashboard() {
  const today = getTodayString();

  const [totalGroups, totalUsers, totalTasks, todayCheckins] =
    await Promise.all([
      prisma.group.count({ where: { disabled: false } }),
      prisma.user.count(),
      prisma.task.count({ where: { enabled: true } }),
      prisma.checkin.count({ where: { date: today } }),
    ]);

  const groups = await prisma.group.findMany({
    where: { disabled: false },
    include: { members: true },
  });

  const groupIds = groups.map((g) => g.id);

  const todayGroupCheckins = await prisma.checkin.findMany({
    where: {
      date: today,
      task: { type: "group" },
      user: { memberships: { some: { groupId: { in: groupIds } } } },
    },
    include: { user: { select: { id: true } } },
  });

  const groupTasks = await prisma.task.findMany({
    where: { type: "group", enabled: true },
  });

  let completedGroups = 0;
  for (const group of groups) {
    const memberIds = group.members.map((m) => m.userId);
    const allDone = groupTasks.every((task) => {
      const count = todayGroupCheckins.filter(
        (c) => c.taskId === task.id && memberIds.includes(c.userId)
      ).length;
      return count === memberIds.length;
    });
    if (allDone && memberIds.length > 0) completedGroups++;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">总览</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="活跃团体" value={totalGroups} />
        <StatCard label="注册用户" value={totalUsers} />
        <StatCard label="系统事项" value={totalTasks} />
        <StatCard label="今日打卡" value={todayCheckins} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3">今日团体完成情况</h2>
        <p className="text-gray-600">
          {completedGroups} / {groups.length} 个团体全员完成
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
