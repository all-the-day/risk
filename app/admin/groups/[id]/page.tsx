import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GroupDetailClient from "./GroupDetailClient";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
      <p className="text-gray-500 mb-6">邀请码: {group.inviteCode}</p>

      <GroupDetailClient group={group} />
    </div>
  );
}
