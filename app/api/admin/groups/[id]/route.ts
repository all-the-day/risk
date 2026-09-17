import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGroupByInviteCode } from "@/db/group";
import { generateInviteCode } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { disabled, name, regenerateCode, leaderMemberId } = body;

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof disabled === "boolean") data.disabled = disabled;
    if (regenerateCode === true) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const inviteCode = generateInviteCode();
        if (!(await getGroupByInviteCode(inviteCode))) {
          data.inviteCode = inviteCode;
          break;
        }
      }
      if (data.inviteCode === undefined) {
        return NextResponse.json(
          { error: "无法生成唯一邀请码，请稍后重试" },
          { status: 500 }
        );
      }
    }

    if (typeof leaderMemberId === "string") {
      // 全家同时只有一个团长：任命前先清掉旧的
      const member = await prisma.groupMember.findFirst({
        where: { id: leaderMemberId, groupId: id },
      });
      if (!member) {
        return NextResponse.json({ error: "成员不存在" }, { status: 404 });
      }
      await prisma.$transaction([
        prisma.groupMember.updateMany({
          where: { groupId: id, role: "leader" },
          data: { role: "member" },
        }),
        prisma.groupMember.update({
          where: { id: leaderMemberId },
          data: { role: "leader" },
        }),
      ]);
    }

    if (Object.keys(data).length === 0) {
      if (typeof leaderMemberId !== "string") {
        return NextResponse.json(
          { error: "没有需要更新的字段" },
          { status: 400 }
        );
      }
      // 只变更了团长，团体本身没有字段要更新
      return NextResponse.json({ success: true });
    }

    const group = await prisma.group.update({
      where: { id },
      data,
    });

    return NextResponse.json(group);
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const memberId = typeof body?.memberId === "string" ? body.memberId : null;

    if (memberId) {
      await prisma.groupMember.delete({
        where: { id: memberId, groupId: id },
      });
      return NextResponse.json({ success: true });
    }

    // 删整个团体：成员与周分靠外键级联删除；打卡记录挂在用户上，保留
    await prisma.group.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
