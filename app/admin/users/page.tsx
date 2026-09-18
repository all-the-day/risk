import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import UsersClient, { type AdminUser } from "./UsersClient";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    include: {
      memberships: { include: { group: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data: AdminUser[] = users.map((user) => ({
    id: user.id,
    nickname: user.nickname,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString().slice(0, 10),
    groups: user.memberships.map((member) => member.group.name),
  }));

  return <UsersClient users={data} currentUserId={admin.id} />;
}
