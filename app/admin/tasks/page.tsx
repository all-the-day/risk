import { prisma } from "@/lib/prisma";
import TasksClient from "./TasksClient";

export default async function AdminTasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">事项管理</h1>
      <TasksClient initialTasks={tasks} />
    </div>
  );
}
