import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: { group: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      <UsersClient
        initialUsers={users}
        currentUserId={admin.id}
      />
    </div>
  );
}
