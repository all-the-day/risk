import { NextResponse } from "next/server";
import { register } from "@/services/auth";
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

    // 后端密码长度校验（主要校验）
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      );
    }

    await register(nickname.trim(), password);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
