"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [showCreate, setShowCreate] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [newTask, setNewTask] = useState({ type: "group", title: "", order: 0 });

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

  async function createTask() {
    setError(null);
    if (!newTask.title.trim()) {
      setError("请输入事项标题");
      return;
    }

    const res = await fetch("/api/admin/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setNewTask({ type: "group", title: "", order: 0 });
      setShowCreate(false);
    } else {
      const data = await res.json();
      setError(data.error || "创建失败");
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("确定删除该事项？已有打卡记录将同时删除。")) return;
    setError(null);

    const res = await fetch(`/api/admin/tasks/delete?id=${taskId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
    }
  }

  const groupTasks = tasks.filter(
    (t) => t.type === "group" && (showDisabled || t.enabled)
  );
  const personalTasks = tasks.filter(
    (t) => t.type === "personal" && (showDisabled || t.enabled)
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create form */}
      <Card>
        <CardContent className="p-4">
          {showCreate ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Select
                  value={newTask.type}
                  onValueChange={(v) =>
                    setNewTask((prev) => ({ ...prev, type: v || "group" }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">团体事项</SelectItem>
                    <SelectItem value="personal">个人事项</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="事项标题"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={newTask.order}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="排序"
                  className="w-20"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTask} size="sm">
                  创建
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={() => setShowCreate(true)} size="sm">
                + 新增事项
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisabled(!showDisabled)}
              >
                {showDisabled ? "隐藏已停用" : "显示全部"}
              </Button>
              {!showDisabled && (
                <span className="text-xs text-muted-foreground">
                  已过滤停用事项
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
        deleteTask={deleteTask}
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
        deleteTask={deleteTask}
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
  deleteTask,
}: {
  title: string;
  tasks: Task[];
  editingId: string | null;
  editTitle: string;
  orderDrafts: Record<string, number>;
  setEditTitle: (v: string) => void;
  setEditingId: (v: string | null) => void;
  setOrderDrafts: (
    fn: (prev: Record<string, number>) => Record<string, number>
  ) => void;
  toggleEnabled: (id: string, enabled: boolean) => void;
  saveTitle: (id: string) => void;
  saveOrder: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">{title}</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="px-4 py-6 text-center text-muted-foreground text-sm">
            暂无事项
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task.id}>
              {i > 0 && <div className="border-t" />}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    value={orderDrafts[task.id] ?? task.order}
                    onChange={(e) =>
                      setOrderDrafts((prev) => ({
                        ...prev,
                        [task.id]: parseInt(e.target.value) || 0,
                      }))
                    }
                    onBlur={() => saveOrder(task.id)}
                    className="w-16 text-center"
                  />
                  {editingId === task.id ? (
                    <Input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(task.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveTitle(task.id)
                      }
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`text-sm cursor-pointer ${
                        task.enabled
                          ? "text-foreground"
                          : "text-muted-foreground"
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
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={task.enabled ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleEnabled(task.id, task.enabled)}
                  >
                    {task.enabled ? "已启用" : "已停用"}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
