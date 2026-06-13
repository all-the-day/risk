"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ItemData {
  id: string;
  name: string;
  fullName: string | null;
  score: number;
  order: number;
  enabled: boolean;
  categoryId: string | null;
  parentId: string | null;
  children: ItemData[];
}

interface CategoryData {
  id: string;
  name: string;
  order: number;
  items: ItemData[];
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  period: string;
  categories: CategoryData[];
  items: ItemData[];
}

interface TemplateDetailClientProps {
  template: TemplateData;
}

export default function TemplateDetailClient({ template }: TemplateDetailClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit template info
  const [editName, setEditName] = useState(template.name);
  const [editDesc, setEditDesc] = useState(template.description || "");
  const [editMaxScore, setEditMaxScore] = useState(template.maxScore);
  const [editingTemplate, setEditingTemplate] = useState(false);

  // Item editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemFullName, setEditItemFullName] = useState("");
  const [editItemScore, setEditItemScore] = useState(0);

  // Add item state
  const [addMode, setAddMode] = useState<"category" | "item" | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addCategoryId, setAddCategoryId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addFullName, setAddFullName] = useState("");
  const [addScore, setAddScore] = useState(0);

  // Add category state
  const [addCategoryName, setAddCategoryName] = useState("");

  const [data, setData] = useState({ categories: template.categories, items: template.items });

  function refresh() {
    router.refresh();
  }

  async function saveTemplate() {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/admin/activities/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDesc || null,
        maxScore: editMaxScore,
      }),
    });
    if (res.ok) {
      setEditingTemplate(false);
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "保存失败");
    }
    setSubmitting(false);
  }

  async function saveItem(itemId: string) {
    setError(null);
    const res = await fetch(`/api/admin/activities/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editItemName,
        fullName: editItemFullName || null,
        score: editItemScore,
      }),
    });
    if (res.ok) {
      setEditingItemId(null);
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "保存失败");
    }
  }

  async function toggleItem(itemId: string, enabled: boolean) {
    setError(null);
    const res = await fetch(`/api/admin/activities/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (res.ok) {
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "操作失败");
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("确定删除该项目？")) return;
    setError(null);
    const res = await fetch(`/api/admin/activities/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "删除失败");
    }
  }

  async function addItem() {
    setError(null);
    if (!addName.trim()) {
      setError("请输入名称");
      return;
    }
    const res = await fetch("/api/admin/activities/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        categoryId: addCategoryId,
        parentId: addParentId,
        name: addName,
        fullName: addFullName || null,
        score: addScore,
      }),
    });
    if (res.ok) {
      setAddMode(null);
      setAddParentId(null);
      setAddCategoryId(null);
      setAddName("");
      setAddFullName("");
      setAddScore(0);
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "创建失败");
    }
  }

  async function addCategory() {
    setError(null);
    if (!addCategoryName.trim()) {
      setError("请输入分类名称");
      return;
    }
    const res = await fetch("/api/admin/activities/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        name: addCategoryName,
      }),
    });
    if (res.ok) {
      setAddMode(null);
      setAddCategoryName("");
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "创建失败");
    }
  }

  async function deleteCategory(catId: string) {
    if (!confirm("确定删除该分类？分类下的项目会取消关联。")) return;
    setError(null);
    const res = await fetch(`/api/admin/activities/categories/${catId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "删除失败");
    }
  }

  function totalScore(): number {
    let sum = 0;
    for (const item of data.items) {
      sum += item.score;
      if (item.children) {
        for (const child of item.children) {
          sum += child.score;
        }
      }
    }
    for (const cat of data.categories) {
      for (const item of cat.items) {
        sum += item.score;
        if (item.children) {
          for (const child of item.children) {
            sum += child.score;
          }
        }
      }
    }
    return sum;
  }

  function renderItem(item: ItemData, depth: number = 0) {
    return (
      <div key={item.id}>
        <div
          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
          style={{ paddingLeft: 16 + depth * 24 }}
        >
          {editingItemId === item.id ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                className="w-24 px-2 py-1 border rounded text-sm"
                placeholder="短名"
              />
              <input
                type="text"
                value={editItemFullName}
                onChange={(e) => setEditItemFullName(e.target.value)}
                className="w-24 px-2 py-1 border rounded text-sm"
                placeholder="全名"
              />
              <input
                type="number"
                value={editItemScore}
                onChange={(e) => setEditItemScore(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 border rounded text-sm"
              />
              <button
                onClick={() => saveItem(item.id)}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              >
                保存
              </button>
              <button
                onClick={() => setEditingItemId(null)}
                className="px-2 py-1 bg-gray-200 rounded text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {depth > 0 && <span className="text-gray-300 text-xs">└</span>}
              <span className={`text-sm ${item.enabled ? "text-gray-800" : "text-gray-400"}`}>
                {item.name}
              </span>
              {item.fullName && (
                <span className="text-xs text-gray-400">({item.fullName})</span>
              )}
              <span className="text-xs font-medium text-blue-600">{item.score}分</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            {!editingItemId || editingItemId !== item.id ? (
              <>
                <button
                  onClick={() => toggleItem(item.id, item.enabled)}
                  className={`px-2 py-1 rounded text-xs ${
                    item.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.enabled ? "启用" : "停用"}
                </button>
                <button
                  onClick={() => {
                    setEditingItemId(item.id);
                    setEditItemName(item.name);
                    setEditItemFullName(item.fullName || "");
                    setEditItemScore(item.score);
                  }}
                  className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                >
                  编辑
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="px-2 py-1 rounded text-xs bg-red-100 text-red-700"
                >
                  删除
                </button>
              </>
            ) : null}
            {(item.children?.length ?? 0) === 0 && (
              <button
                onClick={() => {
                  setAddMode("item");
                  setAddParentId(null);
                  setAddCategoryId(null);
                  // Add as child of this item
                  setAddParentId(item.id);
                  setAddName("");
                  setAddFullName("");
                  setAddScore(0);
                }}
                className="px-2 py-1 rounded text-xs text-blue-500 hover:bg-blue-50"
                title="添加子项"
              >
                +子项
              </button>
            )}
          </div>
        </div>
        {item.children?.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.push("/admin/activities")}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          &larr; 返回模板列表
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Template info section */}
      <div className="bg-white rounded-lg shadow p-4">
        {editingTemplate ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-3 py-2 border rounded text-lg font-bold w-48"
              />
              <input
                type="number"
                value={editMaxScore}
                onChange={(e) => setEditMaxScore(parseInt(e.target.value) || 0)}
                className="px-3 py-2 border rounded w-20"
              />
              <span className="text-sm text-gray-500">分</span>
              <button
                onClick={saveTemplate}
                disabled={submitting}
                className="px-4 py-2 bg-green-500 text-white rounded text-sm"
              >
                {submitting ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => setEditingTemplate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm"
              >
                取消
              </button>
            </div>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="px-3 py-2 border rounded text-sm w-full"
              placeholder="描述（可选）"
              rows={2}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {template.name}
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    满分 {template.maxScore} 分
                  </span>
                </h1>
                {template.description && (
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditingTemplate(true)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                编辑模板
              </button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>周期: {template.period === "weekly" ? "每周" : template.period === "daily" ? "每日" : "每月"}</span>
              <span>当前总分: {totalScore()} 分</span>
            </div>
          </div>
        )}
      </div>

      {/* Items section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">活动项目</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAddMode("category");
                setAddCategoryName("");
              }}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              + 添加分类
            </button>
            <button
              onClick={() => {
                setAddMode("item");
                setAddParentId(null);
                setAddCategoryId(null);
                setAddName("");
                setAddFullName("");
                setAddScore(0);
              }}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              + 添加项目
            </button>
          </div>
        </div>

        {/* Add form */}
        {addMode && (
          <div className="px-4 py-3 bg-blue-50 border-b">
            {addMode === "category" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={addCategoryName}
                  onChange={(e) => setAddCategoryName(e.target.value)}
                  placeholder="分类名称"
                  className="px-3 py-2 border rounded text-sm flex-1"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                >
                  创建
                </button>
                <button
                  onClick={() => setAddMode(null)}
                  className="px-4 py-2 bg-gray-200 rounded text-sm"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="名称（如 CX）"
                    className="px-3 py-2 border rounded text-sm w-32"
                  />
                  <input
                    type="text"
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    placeholder="全名（如 晨兴）"
                    className="px-3 py-2 border rounded text-sm w-32"
                  />
                  <input
                    type="number"
                    value={addScore}
                    onChange={(e) => setAddScore(parseInt(e.target.value) || 0)}
                    placeholder="分值"
                    className="px-3 py-2 border rounded text-sm w-20"
                  />
                  <select
                    value={addCategoryId || ""}
                    onChange={(e) => setAddCategoryId(e.target.value || null)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="">无分类</option>
                    {data.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {addParentId && (
                    <span className="text-xs text-blue-500">作为子项添加</span>
                  )}
                  <button
                    onClick={addItem}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => {
                      setAddMode(null);
                      setAddParentId(null);
                      setAddCategoryId(null);
                    }}
                    className="px-4 py-2 bg-gray-200 rounded text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="divide-y">
          {/* Uncategorized items */}
          {data.items.length > 0 && (
            <div>
              {data.items.map((item) => renderItem(item))}
            </div>
          )}

          {/* Categorized items */}
          {data.categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {cat.name}
                </span>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50"
                >
                  删除分类
                </button>
              </div>
              {cat.items.length === 0 ? (
                <div className="px-4 py-3 text-center text-xs text-gray-400">
                  暂无可分类中的项目
                </div>
              ) : (
                cat.items.map((item) => renderItem(item))
              )}
            </div>
          ))}

          {data.items.length === 0 && data.categories.every((c) => c.items.length === 0) && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              暂无活动项目，点击上方按钮添加
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
