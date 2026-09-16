import { NextResponse } from "next/server";
import { login } from "@/services/auth";
import { validateNickname } from "@/lib/nickname";

export async function POST(request: Request) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: "请输入昵称和密码" },
        { status: 400 }
      );
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }

    const user = await login(nickname.trim(), password);
    return NextResponse.json({ success: true, isAdmin: user.isAdmin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
