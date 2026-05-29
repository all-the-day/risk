import { prisma } from "@/lib/prisma";

export async function getCheckins(userId: string, date: string) {
  return prisma.checkin.findMany({
    where: { userId, date },
  });
}

export async function getCheckin(userId: string, taskId: string, date: string) {
  return prisma.checkin.findUnique({
    where: { userId_taskId_date: { userId, taskId, date } },
  });
}

export async function createCheckin(userId: string, taskId: string, date: string) {
  return prisma.checkin.create({
    data: { userId, taskId, date },
  });
}

export async function deleteCheckin(userId: string, taskId: string, date: string) {
  return prisma.checkin.delete({
    where: { userId_taskId_date: { userId, taskId, date } },
  });
}

export async function getGroupCheckins(groupId: string, date: string) {
  return prisma.checkin.findMany({
    where: {
      date,
      user: {
        memberships: {
          some: { groupId },
        },
      },
    },
    include: {
      user: {
        select: { id: true },
      },
    },
  });
}
