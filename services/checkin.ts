import { prisma } from "@/lib/prisma";
import { getTodayString } from "@/lib/date";
import { getCheckins, createCheckin, deleteCheckin } from "@/db/checkin";
import { getEnabledTasks } from "@/db/task";

export async function getUserCheckinStatus(userId: string) {
  const today = getTodayString();
  const tasks = await getEnabledTasks();
  const checkins = await getCheckins(userId, today);

  const checkinMap = new Map<string, Date>(checkins.map((c: { taskId: string; checkedAt: Date }) => [c.taskId, c.checkedAt]));

  return tasks.map((task: { id: string; title: string; type: string }) => ({
    taskId: task.id,
    taskTitle: task.title,
    taskType: task.type,
    checked: checkinMap.has(task.id),
    checkedAt: checkinMap.get(task.id)?.toISOString() || null,
  }));
}

export async function toggleCheckin(userId: string, taskId: string) {
  const today = getTodayString();
  const existing = await prisma.checkin.findUnique({
    where: { userId_taskId_date: { userId, taskId, date: today } },
  });

  if (existing) {
    await deleteCheckin(userId, taskId, today);
    return { checked: false };
  } else {
    await createCheckin(userId, taskId, today);
    return { checked: true };
  }
}

export async function getGroupDailyStatus(groupId: string) {
  const today = getTodayString();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) throw new Error("团体不存在");

  const tasks = await prisma.task.findMany({
    where: { type: "group", enabled: true },
    orderBy: { order: "asc" },
  });

  const memberIds = group.members.map((m: { userId: string }) => m.userId);

  const checkins = await prisma.checkin.findMany({
    where: {
      date: today,
      userId: { in: memberIds },
      task: { type: "group" },
    },
  });

  const checkinSet = new Set(
    checkins.map((c: { userId: string; taskId: string }) => `${c.userId}:${c.taskId}`)
  );

  const totalMembers = group.members.length;
  const totalTasks = tasks.length;

  const taskStatus = tasks.map((task: { id: string; title: string }) => {
    const completedCount = group.members.filter((m: { userId: string }) =>
      checkinSet.has(`${m.userId}:${task.id}`)
    ).length;

    return {
      taskId: task.id,
      taskTitle: task.title,
      completedCount,
      totalMembers,
      allDone: completedCount === totalMembers,
    };
  });

  const allDone = taskStatus.every((t: { allDone: boolean }) => t.allDone);

  return {
    groupName: group.name,
    totalMembers,
    totalTasks,
    taskStatus,
    allDone,
  };
}
