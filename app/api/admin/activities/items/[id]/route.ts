import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAllowedWeekdays, serializeAllowedWeekdays } from "@/lib/date";

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
    const {
      name,
      score,
      checksPerWeek,
      order,
      enabled,
      allowedWeekdays,
      scope,
      restore,
    } = body;

    if (scope !== undefined && !["personal", "group"].includes(scope)) {
      return NextResponse.json({ error: "类型只能是个人或团体" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (score !== undefined) data.score = score;
    if (checksPerWeek !== undefined) {
      const weekly = Number(checksPerWeek);
      data.checksPerWeek = weekly > 0 ? weekly : 1;
    }
    if (order !== undefined) data.order = order;
    if (enabled !== undefined) data.enabled = enabled;
    if (allowedWeekdays !== undefined) {
      data.allowedWeekdays = serializeAllowedWeekdays(
        parseAllowedWeekdays(allowedWeekdays)
      );
    }
    if (scope !== undefined) data.scope = scope;
    // restore: true = 从回收站恢复
    if (restore === true) data.deletedAt = null;

    const item = await prisma.activityItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
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

    // 软删除：只标记 deletedAt，历史打卡记录保留，可随时恢复
    await prisma.activityItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
