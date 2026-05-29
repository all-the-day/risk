"use client";

import { useState } from "react";

interface Task {
  id: string;
  type: string;
  title: string;
  order: number;
  enabled: boolean;
}

interface TasksClientProps {
  initialTasks: Task[];
}

export default function TasksClient({ initialTasks }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function toggleEnabled(taskId: string, enabled: boolean) {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, enabled: !enabled } : t))
      );
    }
  }

  async function saveTitle(taskId: string) {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title: editTitle } : t))
      );
      setEditingId(null);
    }
  }

  async function updateOrder(taskId: string, order: number) {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, order } : t))
      );
    }
  }

  const groupTasks = tasks.filter((t) => t.type === "group");
  const personalTasks = tasks.filter((t) => t.type === "personal");

  return (
    <div className="space-y-6">
      <TaskSection
        title="团体事项"
        tasks={groupTasks}
        editingId={editingId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        setEditingId={setEditingId}
        toggleEnabled={toggleEnabled}
        saveTitle={saveTitle}
        updateOrder={updateOrder}
      />
      <TaskSection
        title="个人事项"
        tasks={personalTasks}
        editingId={editingId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        setEditingId={setEditingId}
        toggleEnabled={toggleEnabled}
        saveTitle={saveTitle}
        updateOrder={updateOrder}
      />
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  editingId,
  editTitle,
  setEditTitle,
  setEditingId,
  toggleEnabled,
  saveTitle,
  updateOrder,
}: {
  title: string;
  tasks: Task[];
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  setEditingId: (v: string | null) => void;
  toggleEnabled: (id: string, enabled: boolean) => void;
  saveTitle: (id: string) => void;
  updateOrder: (id: string, order: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="divide-y">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={task.order}
                onChange={(e) =>
                  updateOrder(task.id, parseInt(e.target.value) || 0)
                }
                className="w-12 px-2 py-1 border rounded text-center text-sm"
              />
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveTitle(task.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveTitle(task.id)}
                  className="px-2 py-1 border rounded text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm ${
                    task.enabled ? "text-gray-800" : "text-gray-400"
                  }`}
                  onClick={() => {
                    setEditingId(task.id);
                    setEditTitle(task.title);
                  }}
                >
                  {task.title}
                </span>
              )}
            </div>
            <button
              onClick={() => toggleEnabled(task.id, task.enabled)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                task.enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {task.enabled ? "已启用" : "已停用"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
