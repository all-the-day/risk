import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTodayString } from "@/lib/date";
import { toggleChecklistItem } from "@/services/activity";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const itemId = body?.itemId;
    if (typeof itemId !== "string" || !itemId) {
      return NextResponse.json({ error: "缺少项目 id" }, { status: 400 });
    }

    const today = getTodayString();
    const date = typeof body?.date === "string" && body.date ? body.date : today;
    if (!DATE_PATTERN.test(date)) {
      return NextResponse.json({ error: "日期格式不正确" }, { status: 400 });
    }
    if (date > today) {
      return NextResponse.json({ error: "不能给未来日期打卡" }, { status: 400 });
    }

    const result = await toggleChecklistItem(session.userId, itemId, date);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "打卡失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
