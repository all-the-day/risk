import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_NICKNAME = "admin";
const ADMIN_PASSWORD = "admin123";

type ItemDef = {
  key: string;
  name: string;
  score: number;
  checksPerWeek: number;
  order: number;
  scope?: "personal" | "group";
  weekdays?: string; // "0" = 仅主日
};

// 满分 = 所有项目分值之和
// 次数口径来自纸质「团体操练表」：CX 与 追求 一周三次算满分
const ITEM_DEFS: ItemDef[] = [
  { key: "cx", name: "CX", score: 6, checksPerWeek: 3, order: 1 },
  { key: "pursuit", name: "追求", score: 6, checksPerWeek: 3, order: 2 },
  { key: "xp", name: "XP", score: 7, checksPerWeek: 1, order: 3, scope: "group" },
  { key: "zr", name: "ZR", score: 7, checksPerWeek: 1, order: 4, scope: "group", weekdays: "0" },
  { key: "dg", name: "团体DG", score: 6, checksPerWeek: 1, order: 5, scope: "group" },
  { key: "gospel", name: "Gospel", score: 4, checksPerWeek: 1, order: 6 },
  { key: "hygiene", name: "卫生", score: 4, checksPerWeek: 1, order: 7 },
  { key: "speak", name: "主日申言", score: 6, checksPerWeek: 1, order: 8, weekdays: "0" },
  { key: "memorize", name: "背经", score: 4, checksPerWeek: 1, order: 9 },
];

async function seedAdmin() {
  const password = await hash(ADMIN_PASSWORD, 12);
  const existed = await prisma.user.findUnique({
    where: { nickname: ADMIN_NICKNAME },
  });

  if (existed) {
    console.log(`管理员已存在：${ADMIN_NICKNAME}`);
    return;
  }

  await prisma.user.create({
    data: { nickname: ADMIN_NICKNAME, password, isAdmin: true },
  });
  console.log(`管理员已创建：${ADMIN_NICKNAME} / ${ADMIN_PASSWORD}`);
}

async function seedItems() {
  const existed = await prisma.activityItem.count();
  if (existed > 0) {
    console.log(`已有 ${existed} 个项目，跳过`);
    return;
  }

  for (const def of ITEM_DEFS) {
    await prisma.activityItem.create({
      data: {
        name: def.name,
        score: def.score,
        checksPerWeek: def.checksPerWeek,
        allowedWeekdays: def.weekdays ?? null,
        scope: def.scope ?? "personal",
        order: def.order,
      },
    });
  }

  const maxScore = ITEM_DEFS.reduce((sum, i) => sum + i.score, 0);
  console.log(`项目已创建：${ITEM_DEFS.length} 项，满分 ${maxScore}`);
}

async function main() {
  await seedAdmin();
  await seedItems();
  console.log("种子数据完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
