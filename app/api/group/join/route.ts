import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGroupByInviteCode, joinGroup } from "@/db/group";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { nickname, inviteCode } = await request.json();

    if (!nickname || !inviteCode) {
      return NextResponse.json(
        { error: "请输入昵称和邀请码" },
        { status: 400 }
      );
    }

    const group = await getGroupByInviteCode(inviteCode);
    if (!group) {
      return NextResponse.json(
        { error: "邀请码无效" },
        { status: 400 }
      );
    }

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: session.userId, groupId: group.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "你已在该团体中" },
        { status: 400 }
      );
    }

    await joinGroup(session.userId, group.id, nickname);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "加入失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
