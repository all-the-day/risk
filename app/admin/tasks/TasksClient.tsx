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
  const [orderDrafts, setOrderDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  async function toggleEnabled(taskId: string, enabled: boolean) {
    setError(null);
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, enabled: !enabled } : t))
      );
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function saveTitle(taskId: string) {
    setError(null);
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
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function saveOrder(taskId: string) {
    const order = orderDrafts[taskId];
    if (order === undefined) return;
    setError(null);

    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, order } : t))
      );
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  const groupTasks = tasks.filter((t) => t.type === "group");
  const personalTasks = tasks.filter((t) => t.type === "personal");

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <TaskSection
        title="团体事项"
        tasks={groupTasks}
        editingId={editingId}
        editTitle={editTitle}
        orderDrafts={orderDrafts}
        setEditTitle={setEditTitle}
        setEditingId={setEditingId}
        setOrderDrafts={setOrderDrafts}
        toggleEnabled={toggleEnabled}
        saveTitle={saveTitle}
        saveOrder={saveOrder}
      />
      <TaskSection
        title="个人事项"
        tasks={personalTasks}
        editingId={editingId}
        editTitle={editTitle}
        orderDrafts={orderDrafts}
        setEditTitle={setEditTitle}
        setEditingId={setEditingId}
        setOrderDrafts={setOrderDrafts}
        toggleEnabled={toggleEnabled}
        saveTitle={saveTitle}
        saveOrder={saveOrder}
      />
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  editingId,
  editTitle,
  orderDrafts,
  setEditTitle,
  setEditingId,
  setOrderDrafts,
  toggleEnabled,
  saveTitle,
  saveOrder,
}: {
  title: string;
  tasks: Task[];
  editingId: string | null;
  editTitle: string;
  orderDrafts: Record<string, number>;
  setEditTitle: (v: string) => void;
  setEditingId: (v: string | null) => void;
  setOrderDrafts: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  toggleEnabled: (id: string, enabled: boolean) => void;
  saveTitle: (id: string) => void;
  saveOrder: (id: string) => void;
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
                value={orderDrafts[task.id] ?? task.order}
                onChange={(e) =>
                  setOrderDrafts((prev) => ({
                    ...prev,
                    [task.id]: parseInt(e.target.value) || 0,
                  }))
                }
                onBlur={() => saveOrder(task.id)}
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
                  className={`text-sm cursor-pointer ${
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
