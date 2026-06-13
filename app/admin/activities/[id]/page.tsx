import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TemplateDetailClient from "./TemplateDetailClient";

export default async function AdminActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = await prisma.activityTemplate.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          items: {
            where: { parentId: null },
            orderBy: { order: "asc" },
            include: {
              children: { orderBy: { order: "asc" } },
            },
          },
        },
      },
      items: {
        where: { parentId: null, categoryId: null },
        orderBy: { order: "asc" },
        include: {
          children: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <div>
      <TemplateDetailClient
        template={JSON.parse(JSON.stringify(template))}
      />
    </div>
  );
}
