import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
