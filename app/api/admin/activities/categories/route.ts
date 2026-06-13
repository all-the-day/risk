import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { templateId, name, order } = body;

    if (!templateId || !name) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    let catOrder = order;
    if (catOrder === undefined) {
      const maxOrder = await prisma.activityCategory.findFirst({
        where: { templateId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      catOrder = (maxOrder?.order ?? 0) + 1;
    }

    const category = await prisma.activityCategory.create({
      data: { templateId, name, order: catOrder },
    });

    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
