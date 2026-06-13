import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default tasks
  const tasks = [
    { type: "group", title: "晨间阅读", order: 1 },
    { type: "group", title: "晚间总结", order: 2 },
    { type: "group", title: "今日祷告", order: 3 },
    { type: "personal", title: "饮水", order: 4 },
    { type: "personal", title: "散步", order: 5 },
  ];

  for (const task of tasks) {
    const existing = await prisma.task.findFirst({ where: { title: task.title } });
    if (!existing) {
      await prisma.task.create({ data: task });
    }
  }

  // Create admin user
  const adminPhone = "admin";
  const adminPassword = "admin123";
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    const hashedPassword = await hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        password: hashedPassword,
        isAdmin: true,
      },
    });
    console.log(`Admin user created: ${adminPhone} / ${adminPassword}`);
  }

  // Create activity template (周评)
  const templateName = "周评";
  const existingTemplate = await prisma.activityTemplate.findFirst({
    where: { name: templateName },
  });
  if (!existingTemplate) {
    const template = await prisma.activityTemplate.create({
      data: {
        name: templateName,
        description: "每周评分表",
        maxScore: 51,
        period: "weekly",
      },
    });

    // Create category: 尽功用
    const catJinGongYong = await prisma.activityCategory.create({
      data: {
        templateId: template.id,
        name: "尽功用",
        order: 1,
      },
    });

    // Create top-level items (no category)
    const cx = await prisma.activityItem.create({
      data: {
        templateId: template.id,
        name: "CX",
        fullName: "晨兴",
        score: 6,
        order: 1,
      },
    });

    const pursuit = await prisma.activityItem.create({
      data: {
        templateId: template.id,
        name: "追求",
        fullName: "追求",
        score: 6,
        order: 2,
      },
    });

    // Create parent item: 聚会
    const gathering = await prisma.activityItem.create({
      data: {
        templateId: template.id,
        name: "聚会",
        fullName: "聚会",
        score: 14,
        order: 3,
      },
    });

    // Children of 聚会
    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        parentId: gathering.id,
        name: "XP",
        fullName: "擘饼",
        score: 7,
        order: 1,
      },
    });

    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        parentId: gathering.id,
        name: "ZR",
        fullName: "主日",
        score: 7,
        order: 2,
      },
    });

    // 团体DG
    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        name: "团体DG",
        fullName: "团体祷告",
        score: 6,
        order: 4,
      },
    });

    // Items under 尽功用 category
    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        categoryId: catJinGongYong.id,
        name: "Gospel",
        fullName: "福音",
        score: 3,
        order: 1,
      },
    });

    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        categoryId: catJinGongYong.id,
        name: "卫生",
        fullName: "卫生",
        score: 6,
        order: 2,
      },
    });

    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        categoryId: catJinGongYong.id,
        name: "主日申畜",
        fullName: "主日申畜",
        score: 6,
        order: 3,
      },
    });

    await prisma.activityItem.create({
      data: {
        templateId: template.id,
        categoryId: catJinGongYong.id,
        name: "主日奉献",
        fullName: "主日奉献",
        score: 4,
        order: 4,
      },
    });

    console.log(`Activity template created: ${templateName}`);
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
