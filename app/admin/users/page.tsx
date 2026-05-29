import { prisma } from "@/lib/prisma";

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                手机号
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                角色
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                所属团体
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                注册时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{user.phone}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {user.isAdmin ? "管理员" : "普通用户"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {user.memberships.length > 0
                    ? user.memberships.map((m) => m.group.name).join(", ")
                    : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
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
