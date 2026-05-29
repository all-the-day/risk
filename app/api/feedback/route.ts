import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { type, content } = await request.json();

    if (!type || !content) {
      return NextResponse.json({ error: "请填写反馈类型和内容" }, { status: 400 });
    }

    if (type !== "bug" && type !== "feature") {
      return NextResponse.json({ error: "反馈类型无效" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        content,
        userId: session.userId,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
