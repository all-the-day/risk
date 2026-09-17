import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isAdmin, password } = body;

    const data: Record<string, unknown> = {};
    if (typeof isAdmin === "boolean") {
      if (id === session.userId && !isAdmin) {
        return NextResponse.json(
          { error: "不能取消自己的管理员身份" },
          { status: 400 }
        );
      }
      data.isAdmin = isAdmin;
    }
    if (typeof password === "string" && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
      }
      data.password = await hash(password, 12);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: user.id, isAdmin: user.isAdmin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!admin?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    if (id === session.userId) {
      return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
    }

    // 加入关系、打卡记录、周分、反馈都挂在用户上，外键级联删除
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
