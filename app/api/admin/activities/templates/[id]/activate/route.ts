import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    // Get the template with all items
    const template = await prisma.activityTemplate.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!template) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    // Collect all leaf items (items without children)
    const allItems = await prisma.activityItem.findMany({
      where: { templateId: id, parentId: null },
      include: { children: true },
    });

    const leafItems: { name: string; score: number; checksPerWeek: number; order: number }[] = [];

    for (const item of allItems) {
      if (item.children.length === 0) {
        // Leaf item, no children
        leafItems.push({
          name: item.name,
          score: item.score,
          checksPerWeek: item.checksPerWeek,
          order: item.order,
        });
      }
      // Add children as leaf items too
      for (const child of item.children) {
        leafItems.push({
          name: child.name,
          score: child.score,
          checksPerWeek: child.checksPerWeek,
          order: item.order * 100 + child.order,
        });
      }
    }

    // Disable all existing tasks
    await prisma.task.updateMany({
      where: {},
      data: { enabled: false },
    });

    // Create/update tasks from template items
    const results = [];
    for (const item of leafItems) {
      const task = await prisma.task.create({
        data: {
          type: "group",
          title: item.name,
          score: item.score,
          checksPerWeek: item.checksPerWeek,
          order: item.order,
        },
      });
      results.push(task);
    }

    return NextResponse.json({
      success: true,
      activated: results.length,
      templateName: template.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "激活失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
