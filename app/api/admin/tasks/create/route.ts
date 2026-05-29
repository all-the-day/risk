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
    const { type, title, order } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "事项标题不能超过100字" }, { status: 400 });
    }

    if (type !== "group" && type !== "personal") {
      return NextResponse.json({ error: "类型无效" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: { type, title, order: order || 0 },
    });

    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
