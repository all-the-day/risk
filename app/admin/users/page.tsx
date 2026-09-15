import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
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

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                手机号
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                角色
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                所属团体
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                注册时间
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{user.phone}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    variant={user.isAdmin ? "default" : "secondary"}
                  >
                    {user.isAdmin ? "管理员" : "普通用户"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {user.memberships.length > 0
                    ? user.memberships.map((m) => m.group.name).join(", ")
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
