import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toggleCheckin } from "@/services/checkin";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "缺少任务ID" }, { status: 400 });
    }

    const result = await toggleCheckin(session.userId, taskId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
