import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                名称
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                邀请码
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                成员数
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                状态
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                创建时间
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{group.name}</td>
                <td className="px-4 py-3 text-sm font-mono">
                  {group.inviteCode}
                </td>
                <td className="px-4 py-3 text-sm">{group.members.length}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    variant={group.disabled ? "destructive" : "default"}
                  >
                    {group.disabled ? "已禁用" : "正常"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(group.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/admin/groups/${group.id}`}
                    className="text-primary hover:underline"
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
