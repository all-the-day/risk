import { prisma } from "@/lib/prisma";

export async function getEnabledTasks() {
  return prisma.task.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
}

export async function getTasksByType(type: "group" | "personal") {
  return prisma.task.findMany({
    where: { type, enabled: true },
    orderBy: { order: "asc" },
  });
}
