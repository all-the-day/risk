import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { validateNickname } from "@/lib/nickname";

// 管理员代建账号。不复用 services/auth 的 register()：那会顺带创建会话，
// 把当前管理员的登录 cookie 顶成新用户的
export async function POST(request: Request) {
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

    const { nickname, password, isAdmin } = await request.json();
    if (typeof nickname !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "请输入昵称和密码" }, { status: 400 });
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const trimmed = nickname.trim();
    const existing = await prisma.user.findUnique({
      where: { nickname: trimmed },
    });
    if (existing) {
      return NextResponse.json({ error: "该昵称已被使用" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        nickname: trimmed,
        password: hashedPassword,
        isAdmin: isAdmin === true,
      },
    });

    return NextResponse.json({ id: user.id, nickname: user.nickname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
