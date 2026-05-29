import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    include: {
      members: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">团体管理</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                名称
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                邀请码
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                成员数
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                状态
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                创建时间
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{group.name}</td>
                <td className="px-4 py-3 text-sm font-mono">
                  {group.inviteCode}
                </td>
                <td className="px-4 py-3 text-sm">{group.members.length}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      group.disabled
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {group.disabled ? "已禁用" : "正常"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(group.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/admin/groups/${group.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
