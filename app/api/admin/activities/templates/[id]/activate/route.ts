import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 把该模板设为「当前启用的模板」（同时只允许一个）
export async function POST(
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

    const template = await prisma.activityTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.activityTemplate.updateMany({
        where: { enabled: true },
        data: { enabled: false },
      }),
      prisma.activityTemplate.update({
        where: { id },
        data: { enabled: true },
      }),
    ]);

    return NextResponse.json({ success: true, templateName: template.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "启用失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
