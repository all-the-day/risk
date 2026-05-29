import { prisma } from "@/lib/prisma";

export async function getGroupWithMembers(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true } } },
      },
    },
  });
}

export async function getGroupByInviteCode(inviteCode: string) {
  return prisma.group.findUnique({
    where: { inviteCode },
  });
}

export async function createGroup(name: string, inviteCode: string) {
  return prisma.group.create({
    data: { name, inviteCode },
  });
}

export async function joinGroup(userId: string, groupId: string, nickname: string) {
  return prisma.groupMember.create({
    data: { userId, groupId, nickname },
  });
}

export async function getUserGroups(userId: string) {
  return prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });
}
