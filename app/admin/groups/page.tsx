import { prisma } from "@/lib/prisma";
import GroupsClient from "./GroupsClient";

export type AdminGroupMember = {
  id: string;
  nickname: string;
  loginName: string;
  role: string;
};

export type AdminGroup = {
  id: string;
  name: string;
  inviteCode: string;
  disabled: boolean;
  createdAt: string;
  members: AdminGroupMember[];
};

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { nickname: true } } },
      },
    },
  });

  const data: AdminGroup[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    disabled: group.disabled,
    createdAt: group.createdAt.toISOString().slice(0, 10),
    members: group.members.map((member) => ({
      id: member.id,
      nickname: member.nickname,
      loginName: member.user.nickname,
      role: member.role,
    })),
  }));

  return <GroupsClient groups={data} />;
}
