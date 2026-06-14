import { prisma } from "@/lib/prisma";

export async function getActiveTemplate() {
  return prisma.activityTemplate.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          items: {
            where: { parentId: null, enabled: true },
            orderBy: { order: "asc" },
            include: {
              children: {
                where: { enabled: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      items: {
        where: { parentId: null, categoryId: null, enabled: true },
        orderBy: { order: "asc" },
        include: {
          children: {
            where: { enabled: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}
