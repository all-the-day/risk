import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "日期格式无效，应为 yyyy-MM-dd" },
        { status: 400 }
      );
    }

    const checkins = await prisma.checkin.findMany({
      where: { date },
      include: {
        user: { select: { phone: true } },
        task: { select: { title: true, type: true } },
      },
      orderBy: { checkedAt: "desc" },
    });

    return NextResponse.json(checkins);
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
