/**
 * 开发用演示数据：一个家 + 5 位成员 + 最近 3 周的打卡记录 + 1 条管理员录入的周分。
 * 与 seed.ts 分开，方便随时重置演示数据。
 *   npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, format, startOfWeek } from "date-fns";

const prisma = new PrismaClient();

const GROUP_NAME = "风起之家";
const DEMO_PASSWORD = "123456";
const WEEKS_BACK = 3;

// 昵称（同时用作登录账号）+ 每日类事项的打卡日（0=周日…6=周六）+ 每周一次类事项少做几项
const MEMBERS = [
  { nickname: "潘SY", days: [0, 1, 2, 3, 4, 5, 6], weeklySkip: 0 },
  { nickname: "徐L", days: [0, 1, 2, 3, 4, 5], weeklySkip: 0 },
  { nickname: "X娟", days: [1, 3, 5], weeklySkip: 2 },
  { nickname: "YS晨", days: [0, 2, 4, 6], weeklySkip: 1 },
  { nickname: "林YX", days: [0, 1, 2, 3, 4, 6], weeklySkip: 0 },
];

function weekStartOf(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 0 }), "yyyy-MM-dd");
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function main() {
  const template = await prisma.activityTemplate.findFirst({
    where: { enabled: true },
    include: { items: true },
  });
  if (!template) {
    throw new Error("没有启用的事项模板，请先运行 npm run db:seed");
  }

  // 叶子项 = 没有子项的事项（父项不参与计分）
  const parentIds = new Set(
    template.items.filter((i) => i.parentId).map((i) => i.parentId)
  );
  const leaves = template.items.filter(
    (i) => i.enabled && !parentIds.has(i.id)
  );
  const weeklyItems = leaves.filter((i) => i.checksPerWeek <= 1);

  // 重置演示数据
  const nicknames = MEMBERS.map((m) => m.nickname);
  await prisma.user.deleteMany({ where: { nickname: { in: nicknames } } });
  await prisma.group.deleteMany({ where: { name: GROUP_NAME } });

  const today = format(new Date(), "yyyy-MM-dd");
  const currentWeekStart = weekStartOf(new Date());
  const weeks: string[] = [];
  for (let i = WEEKS_BACK - 1; i >= 0; i--) {
    weeks.push(
      format(addDays(new Date(`${currentWeekStart}T00:00:00`), -i * 7), "yyyy-MM-dd")
    );
  }

  const password = await hash(DEMO_PASSWORD, 12);
  const group = await prisma.group.create({
    data: { name: GROUP_NAME, inviteCode: generateInviteCode() },
  });

  for (const member of MEMBERS) {
    const user = await prisma.user.create({
      data: { nickname: member.nickname, password },
    });
    await prisma.groupMember.create({
      data: { userId: user.id, groupId: group.id, nickname: member.nickname },
    });

    for (const week of weeks) {
      const start = new Date(`${week}T00:00:00`);
      for (const item of leaves) {
        const dates: string[] = [];

        if (item.checksPerWeek > 1) {
          // 每日类：在成员自己的打卡日里取，最多 checksPerWeek 天
          for (const day of member.days) {
            if (dates.length >= item.checksPerWeek) break;
            const date = format(addDays(start, day), "yyyy-MM-dd");
            if (date > today) continue; // 本周还没到的日子不造数据
            dates.push(date);
          }
        } else {
          // 每周一次类：weeklySkip 表示少做最后几项
          const index = weeklyItems.findIndex((w) => w.id === item.id);
          if (index >= weeklyItems.length - member.weeklySkip) continue;
          dates.push(format(start, "yyyy-MM-dd"));
        }

        for (const date of dates) {
          await prisma.activityRecord.create({
            data: { userId: user.id, itemId: item.id, date },
          });
        }
      }
    }
  }

  // 一条管理员录入的周分：用于验证"管理员优先 + 已锁定"（X娟自打卡偏低，管理员给她补到 33）
  const xjuan = await prisma.user.findUnique({
    where: { nickname: "X娟" },
  });
  await prisma.weeklyScore.create({
    data: {
      userId: xjuan!.id,
      groupId: group.id,
      weekStart: currentWeekStart,
      score: 33,
    },
  });

  console.log(
    `演示数据完成：${GROUP_NAME}（邀请码 ${group.inviteCode}）·${MEMBERS.length} 人 · ${leaves.length} 项 · ${weeks.length} 周记录`
  );
  console.log(
    `登录示例（用昵称，不要用手机号）：${MEMBERS[0].nickname} / ${DEMO_PASSWORD}（管理员 admin / admin123）`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
