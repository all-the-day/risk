import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { groupId } = await request.json();
    if (typeof groupId !== "string" || !groupId) {
      return NextResponse.json({ error: "缺少团体 id" }, { status: 400 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: session.userId, groupId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "你不在该团体中" }, { status: 400 });
    }

    await prisma.groupMember.delete({ where: { id: membership.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "退出失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
