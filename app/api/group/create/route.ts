import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createGroup, joinGroup, getGroupByInviteCode } from "@/db/group";
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

    let inviteCode: string = "";
    let group;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      inviteCode = generateInviteCode();
      const existing = await getGroupByInviteCode(inviteCode);
      if (!existing) {
        group = await createGroup(name, inviteCode);
        break;
      }
      if (attempt === maxAttempts - 1) {
        throw new Error("无法生成唯一邀请码，请稍后重试");
      }
    }
    await joinGroup(session.userId, group!.id, nickname);

    return NextResponse.json({ success: true, inviteCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
