import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAllowedWeekdays, serializeAllowedWeekdays } from "@/lib/date";

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      name,
      score,
      checksPerWeek,
      order,
      allowedWeekdays,
      scope,
    } = body;

    if (!name || score == null) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "名称不能超过50字" }, { status: 400 });
    }

    if (scope !== undefined && !["personal", "group"].includes(scope)) {
      return NextResponse.json({ error: "类型只能是个人或团体" }, { status: 400 });
    }

    // 没指定顺序就排在最后
    let itemOrder = order;
    if (itemOrder === undefined) {
      const maxOrder = await prisma.activityItem.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      itemOrder = (maxOrder?.order ?? 0) + 1;
    }

    const item = await prisma.activityItem.create({
      data: {
        name,
        score,
        checksPerWeek: Number(checksPerWeek) > 0 ? Number(checksPerWeek) : 1,
        allowedWeekdays: serializeAllowedWeekdays(
          parseAllowedWeekdays(allowedWeekdays)
        ),
        scope: scope ?? "personal",
        order: itemOrder,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
