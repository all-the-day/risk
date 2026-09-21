import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecordsInRange } from "@/db/record";
import { setChecklistItem } from "@/services/activity";
import { getTodayString, getWeekEnd, isValidWeekStart } from "@/lib/date";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 抽屉「按表格」打开时按需拉该成员该周的打卡明细
export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const weekStart = searchParams.get("weekStart");
    if (!userId || !weekStart) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    if (!isValidWeekStart(weekStart)) {
      return NextResponse.json(
        { error: "周次不正确（应为某周周日的日期）" },
        { status: 400 }
      );
    }

    const records = await getRecordsInRange(
      [userId],
      weekStart,
      getWeekEnd(weekStart)
    );

    return NextResponse.json({
      records: records.map((record) => ({
        itemId: record.itemId,
        date: record.date,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 管理员代录打卡（勾 / 取消）：与成员自己打的卡是同一份记录
export async function PUT(request: Request) {
  try {
    const admin = await requireAdminApi();
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { userId, itemId, date, checked } = body ?? {};
    if (
      typeof userId !== "string" ||
      typeof itemId !== "string" ||
      typeof date !== "string" ||
      !userId ||
      !itemId ||
      !date
    ) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    if (typeof checked !== "boolean") {
      return NextResponse.json({ error: "checked 必须是布尔值" }, { status: 400 });
    }
    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json({ error: "日期格式不正确" }, { status: 400 });
    }
    if (date > getTodayString()) {
      return NextResponse.json({ error: "不能给未来日期打卡" }, { status: 400 });
    }

    const member = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "成员不存在" }, { status: 400 });
    }

    const result = await setChecklistItem(userId, itemId, date, checked);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
