import { NextResponse } from "next/server";
import { login } from "@/services/auth";
import { validateNickname } from "@/lib/nickname";

export async function POST(request: Request) {
  try {
    const { nickname, password } = await request.json();

    // 类型守卫：非字符串（如数字手机号）一律按"缺失"处理，
    // 避免 value.trim / bcrypt 抛出的内部错误原文被回给客户端
    if (
      typeof nickname !== "string" ||
      typeof password !== "string" ||
      !nickname ||
      !password
    ) {
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
