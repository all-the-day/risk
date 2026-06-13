import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const templates = await prisma.activityTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取模板列表失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { name, description, maxScore, period } = body;

    if (!name || maxScore == null) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "模板名称不能超过50字" }, { status: 400 });
    }

    const template = await prisma.activityTemplate.create({
      data: { name, description, maxScore, period: period || "weekly" },
    });

    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
