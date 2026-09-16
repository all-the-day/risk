import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_NICKNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const TEMPLATE_NAME = "周评";
const TEMPLATE_DESC = "每周功课评分表";
const CATEGORY_JGY = "尽功用";

type ItemDef = {
  key: string;
  name: string;
  fullName: string;
  score: number;
  checksPerWeek: number;
  order: number;
  parent?: string;
  category?: string;
};

// 叶子项合计必须等于模板 maxScore（周表分母）
const ITEM_DEFS: ItemDef[] = [
  { key: "cx", name: "CX", fullName: "晨兴", score: 6, checksPerWeek: 6, order: 1 },
  { key: "pursuit", name: "追求", fullName: "追求", score: 6, checksPerWeek: 6, order: 2 },
  // 父项：分值 = 子项之和，本身不参与打卡与计分
  { key: "gathering", name: "聚会", fullName: "聚会", score: 14, checksPerWeek: 1, order: 3 },
  { key: "xp", name: "XP", fullName: "擘饼", score: 7, checksPerWeek: 1, order: 1, parent: "gathering" },
  { key: "zr", name: "ZR", fullName: "主日", score: 7, checksPerWeek: 1, order: 2, parent: "gathering" },
  { key: "dg", name: "团体DG", fullName: "团体祷告", score: 6, checksPerWeek: 6, order: 4 },
  {
    key: "gospel",
    name: "Gospel",
    fullName: "福音",
    score: 3,
    checksPerWeek: 1,
    order: 1,
    category: CATEGORY_JGY,
  },
  {
    key: "hygiene",
    name: "卫生",
    fullName: "卫生",
    score: 6,
    checksPerWeek: 1,
    order: 2,
    category: CATEGORY_JGY,
  },
  {
    key: "speak",
    name: "主日申言",
    fullName: "主日申言",
    score: 6,
    checksPerWeek: 1,
    order: 3,
    category: CATEGORY_JGY,
  },
  {
    key: "offering",
    name: "主日奉献",
    fullName: "主日奉献",
    score: 4,
    checksPerWeek: 1,
    order: 4,
    category: CATEGORY_JGY,
  },
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

async function seedTemplate() {
  const existed = await prisma.activityTemplate.findFirst({
    where: { name: TEMPLATE_NAME },
  });
  if (existed) {
    console.log(`模板已存在，跳过：${TEMPLATE_NAME}`);
    return;
  }

  const parentKeys = new Set(ITEM_DEFS.filter((i) => i.parent).map((i) => i.parent));
  const leafTotal = ITEM_DEFS.filter((i) => !parentKeys.has(i.key)).reduce(
    (sum, i) => sum + i.score,
    0
  );

  const template = await prisma.activityTemplate.create({
    data: {
      name: TEMPLATE_NAME,
      description: TEMPLATE_DESC,
      maxScore: leafTotal,
      enabled: true,
    },
  });

  const category = await prisma.activityCategory.create({
    data: { templateId: template.id, name: CATEGORY_JGY, order: 1 },
  });

  const idByKey = new Map<string, string>();
  const create = async (def: ItemDef) => {
    const item = await prisma.activityItem.create({
      data: {
        templateId: template.id,
        categoryId: def.category ? category.id : null,
        parentId: def.parent ? idByKey.get(def.parent) : null,
        name: def.name,
        fullName: def.fullName,
        score: def.score,
        checksPerWeek: def.checksPerWeek,
        order: def.order,
      },
    });
    idByKey.set(def.key, item.id);
  };

  for (const def of ITEM_DEFS.filter((i) => !i.parent)) await create(def);
  for (const def of ITEM_DEFS.filter((i) => i.parent)) await create(def);

  const items = await prisma.activityItem.findMany({
    where: { templateId: template.id },
    select: { id: true, parentId: true, score: true },
  });
  const parentIds = new Set(items.filter((i) => i.parentId).map((i) => i.parentId));
  const checked = items
    .filter((i) => !parentIds.has(i.id))
    .reduce((sum, i) => sum + i.score, 0);

  console.log(
    `模板已创建：${TEMPLATE_NAME}（${ITEM_DEFS.length} 项，叶子合计 ${leafTotal}）`
  );
  if (checked !== leafTotal) {
    throw new Error(`叶子项合计 ${checked} 与 maxScore ${leafTotal} 不一致`);
  }
}

async function main() {
  await seedAdmin();
  await seedTemplate();
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
