"use client";

import { useState } from "react";

interface FeedbackRecord {
  id: string;
  type: string;
  content: string;
  status: string;
  createdAt: Date;
  user: { phone: string };
}

export default function FeedbackClient({
  initialFeedbacks,
}: {
  initialFeedbacks: FeedbackRecord[];
}) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setError(null);
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      );
    } else {
      const data = await res.json();
      setError(data.error || "更新失败");
    }
  }

  function generatePrompt(feedback: FeedbackRecord): string {
    const typeLabel = feedback.type === "bug" ? "Bug 修复" : "功能建议";
    return `# ${typeLabel}

## 反馈内容
${feedback.content}

## 项目上下文
- 项目：每日功课（匿名协作式每日功课系统）
- 技术栈：Next.js 15 + React 19 + TypeScript + Prisma + SQLite + Tailwind CSS
- 项目结构：
  - app/：页面和 API 路由
  - components/：UI 组件
  - db/：数据访问层
  - services/：业务逻辑层
  - lib/：工具函数
  - prisma/：数据库 schema

## 任务
请根据以上反馈内容，分析问题并提供解决方案。如果是 bug，请定位问题所在并修复。如果是功能建议，请评估可行性并实现。
`;
  }

  function copyPrompt(feedback: FeedbackRecord) {
    const prompt = generatePrompt(feedback);
    navigator.clipboard.writeText(prompt);
    setCopiedId(feedback.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function exportJSON() {
    const data = filtered.map((f) => ({
      id: f.id,
      type: f.type,
      content: f.content,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      userPhone: f.user.phone,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedbacks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered =
    filter === "all"
      ? feedbacks
      : feedbacks.filter((f) => f.status === filter);

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["all", "pending", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-sm ${
                filter === s
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {s === "all" ? "全部" : s === "pending" ? "待处理" : "已处理"}
            </button>
          ))}
        </div>
        <button
          onClick={exportJSON}
          className="px-4 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
        >
          导出 JSON
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
            暂无反馈
          </div>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      f.type === "bug"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {f.type === "bug" ? "Bug" : "建议"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      f.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {f.status === "pending" ? "待处理" : "已处理"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(f.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <p className="text-sm text-gray-800 mb-3">{f.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  提交者: {f.user.phone}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyPrompt(f)}
                    className={`px-3 py-1 rounded text-xs ${
                      copiedId === f.id
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {copiedId === f.id ? "已复制" : "复制 Prompt"}
                  </button>
                  <button
                    onClick={() =>
                      updateStatus(
                        f.id,
                        f.status === "pending" ? "resolved" : "pending"
                      )
                    }
                    className={`px-3 py-1 rounded text-xs ${
                      f.status === "pending"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {f.status === "pending" ? "标记已处理" : "标记待处理"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
