import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createGroup, joinGroup } from "@/db/group";
import { generateInviteCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { name, nickname } = await request.json();

    if (!name || !nickname) {
      return NextResponse.json(
        { error: "请输入团体名称和昵称" },
        { status: 400 }
      );
    }

    const inviteCode = generateInviteCode();
    const group = await createGroup(name, inviteCode);
    await joinGroup(session.userId, group.id, nickname);

    return NextResponse.json({ success: true, inviteCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
