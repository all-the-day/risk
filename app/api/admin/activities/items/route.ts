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
    const { templateId, categoryId, parentId, name, fullName, score, order } = body;

    if (!templateId || !name || score == null) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "名称不能超过50字" }, { status: 400 });
    }

    // Get the max order for the template if not specified
    let itemOrder = order;
    if (itemOrder === undefined) {
      const maxOrder = await prisma.activityItem.findFirst({
        where: { templateId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      itemOrder = (maxOrder?.order ?? 0) + 1;
    }

    const item = await prisma.activityItem.create({
      data: {
        templateId,
        categoryId: categoryId || null,
        parentId: parentId || null,
        name,
        fullName: fullName || null,
        score,
        order: itemOrder,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
