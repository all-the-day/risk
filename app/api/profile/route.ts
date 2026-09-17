import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateNickname } from "@/lib/nickname";

// 修改自己在某个家内的昵称（界面与周表展示用的是 GroupMember.nickname，
// 不是登录账号 User.nickname，所以登录名不受影响）
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { nickname, membershipId } = await request.json();
    if (
      typeof nickname !== "string" ||
      typeof membershipId !== "string" ||
      !membershipId
    ) {
      return NextResponse.json({ error: "请输入新昵称" }, { status: 400 });
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json({ error: nicknameError }, { status: 400 });
    }

    const result = await prisma.groupMember.updateMany({
      where: { id: membershipId, userId: session.userId },
      data: { nickname: nickname.trim() },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "加入关系不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
