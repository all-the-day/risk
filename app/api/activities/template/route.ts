import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveTemplate } from "@/services/activity";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const template = await getActiveTemplate();

    if (!template) {
      return NextResponse.json({ error: "暂无活动模板" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取模板失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
