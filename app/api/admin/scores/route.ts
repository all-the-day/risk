import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnabledItems } from "@/db/activity";
import { maxScoreOf } from "@/lib/score";
import { upsertScore, deleteScore } from "@/db/weekly-score";
import { isFutureWeek, isValidWeekStart } from "@/lib/date";

async function requireAdminSession() {
  const session = await getSession();
  if (!session) return { error: "未登录", status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isAdmin: true },
  });
  if (!user?.isAdmin) return { error: "无权限", status: 403 as const };

  return { userId: user.id };
}

// 校验：周键合法且非未来、该用户确实属于该团体
async function validateTarget(userId: string, groupId: string, weekStart: string) {
  if (!isValidWeekStart(weekStart)) {
    return { error: "周次不正确（应为某周周日的日期）", status: 400 as const };
  }
  if (isFutureWeek(weekStart)) {
    return { error: "不能给未来周录入分数", status: 400 as const };
  }

  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { id: true },
  });
  if (!member) {
    return { error: "该成员不在这个家里", status: 400 as const };
  }

  return { ok: true as const };
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminSession();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { userId, groupId, weekStart, score } = body ?? {};
    if (!userId || !groupId || !weekStart) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const target = await validateTarget(userId, groupId, weekStart);
    if ("error" in target) {
      return NextResponse.json({ error: target.error }, { status: target.status });
    }

    const items = await getEnabledItems();
    if (items.length === 0) {
      return NextResponse.json({ error: "还没有配置项目" }, { status: 400 });
    }
    const maxScore = maxScoreOf(items);

    const value = Number(score);
    if (!Number.isInteger(value) || value < 0) {
      return NextResponse.json({ error: "分数必须是不小于 0 的整数" }, { status: 400 });
    }
    if (value > maxScore) {
      return NextResponse.json(
        { error: `分数不能超过满分 ${maxScore}` },
        { status: 400 }
      );
    }

    await upsertScore({
      userId,
      groupId,
      weekStart,
      score: value,
      updatedById: admin.userId,
    });

    return NextResponse.json({ score: value, source: "admin" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdminSession();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { userId, groupId, weekStart } = body ?? {};
    if (!userId || !groupId || !weekStart) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const target = await validateTarget(userId, groupId, weekStart);
    if ("error" in target) {
      return NextResponse.json({ error: target.error }, { status: target.status });
    }

    await deleteScore(userId, groupId, weekStart);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "恢复失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
