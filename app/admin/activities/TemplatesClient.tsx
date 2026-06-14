"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
}

interface TemplatesClientProps {
  initialTemplates: TemplateData[];
}

const periodLabels: Record<string, string> = {
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
};

export default function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateData[]>(initialTemplates);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    maxScore: 100,
    period: "weekly",
  });

  const [activatingId, setActivatingId] = useState<string | null>(null);

  async function activateTemplate(id: string, name: string) {
    if (!confirm(`确定启用模板"${name}"？当前所有事项将被替换。`)) return;
    setError(null);
    setActivatingId(id);

    const res = await fetch(`/api/admin/activities/templates/${id}/activate`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      setError(null);
    } else {
      const data = await res.json();
      setError(data.error || "启用失败");
    }
    setActivatingId(null);
  }

  async function createTemplate() {
    setError(null);
    if (!newTemplate.name.trim()) {
      setError("请输入模板名称");
      return;
    }

    const res = await fetch("/api/admin/activities/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });

    if (res.ok) {
      const template = await res.json();
      setTemplates((prev) => [template, ...prev]);
      setNewTemplate({ name: "", description: "", maxScore: 100, period: "weekly" });
      setShowCreate(false);
    } else {
      const data = await res.json();
      setError(data.error || "创建失败");
    }
  }

  async function deleteTemplate(id: string, name: string) {
    if (!confirm(`确定删除模板"${name}"？其下所有分类和项目将同时删除。`)) return;
    setError(null);

    const res = await fetch(`/api/admin/activities/templates/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-lg shadow p-4">
        {showCreate ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="模板名称"
                className="px-3 py-2 border rounded text-sm"
              />
              <select
                value={newTemplate.period}
                onChange={(e) =>
                  setNewTemplate((prev) => ({ ...prev, period: e.target.value }))
                }
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
              <input
                type="text"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="描述（可选）"
                className="px-3 py-2 border rounded text-sm"
              />
              <input
                type="number"
                value={newTemplate.maxScore}
                onChange={(e) =>
                  setNewTemplate((prev) => ({
                    ...prev,
                    maxScore: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="满分"
                className="px-3 py-2 border rounded text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + 新增模板
          </button>
        )}
      </div>

      {/* Template list */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">模板列表</h2>
        </div>
        <div className="divide-y">
          {templates.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              暂无模板
            </div>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/admin/activities/${tpl.id}`)}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {tpl.name}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {periodLabels[tpl.period] || tpl.period}
                    </span>
                    <span className="text-xs text-gray-500">
                      满分 {tpl.maxScore}
                    </span>
                    <span className="text-xs text-gray-400">
                      {tpl._count?.items ?? 0} 项
                    </span>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{tpl.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push(`/admin/activities/${tpl.id}`)}
                    className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => activateTemplate(tpl.id, tpl.name)}
                    disabled={activatingId === tpl.id}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      activatingId === tpl.id
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {activatingId === tpl.id ? "启用中..." : "启用"}
                  </button>
                  <button
                    onClick={() => deleteTemplate(tpl.id, tpl.name)}
                    className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
