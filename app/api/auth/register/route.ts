import { NextResponse } from "next/server";
import { register } from "@/services/auth";

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "请输入手机号和密码" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      );
    }

    await register(phone, password);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
