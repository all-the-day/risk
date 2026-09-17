"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface ItemData {
  id: string;
  name: string;
  fullName: string | null;
  score: number;
  checksPerWeek: number;
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
  enabled: boolean;
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
  const [editItemChecks, setEditItemChecks] = useState(1);

  // Add item state
  const [addMode, setAddMode] = useState<"category" | "item" | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addCategoryId, setAddCategoryId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addFullName, setAddFullName] = useState("");
  const [addScore, setAddScore] = useState(0);
  const [addChecks, setAddChecks] = useState(1);

  // Add category state
  const [addCategoryName, setAddCategoryName] = useState("");

  // Rename category
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

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
        checksPerWeek: editItemChecks,
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
        checksPerWeek: addChecks,
      }),
    });
    if (res.ok) {
      setAddMode(null);
      setAddParentId(null);
      setAddCategoryId(null);
      setAddName("");
      setAddFullName("");
      setAddScore(0);
      setAddChecks(1);
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

  async function saveCategory(catId: string) {
    if (!editCategoryName.trim()) {
      setError("请输入分类名称");
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/activities/categories/${catId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCategoryName }),
    });
    if (res.ok) {
      setEditingCategoryId(null);
      refresh();
    } else {
      const d = await res.json();
      setError(d.error || "保存失败");
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
          className="flex items-center justify-between px-4 py-2 hover:bg-muted/50"
          style={{ paddingLeft: 16 + depth * 24 }}
        >
          {editingItemId === item.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                className="w-24"
                placeholder="短名"
              />
              <Input
                type="text"
                value={editItemFullName}
                onChange={(e) => setEditItemFullName(e.target.value)}
                className="w-24"
                placeholder="全名"
              />
              <Input
                type="number"
                value={editItemScore}
                onChange={(e) => setEditItemScore(parseInt(e.target.value) || 0)}
                className="w-16"
                placeholder="分值"
              />
              <Input
                type="number"
                value={editItemChecks}
                onChange={(e) => setEditItemChecks(parseInt(e.target.value) || 1)}
                className="w-16"
                placeholder="周次"
                title="每周需要完成的次数"
              />
              <Button
                size="xs"
                variant="ghost"
                className="bg-success-foreground text-white hover:bg-success-foreground/90"
                onClick={() => saveItem(item.id)}
              >
                保存
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setEditingItemId(null)}
              >
                取消
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {depth > 0 && (
                <span className="text-muted-foreground/50 text-xs">└</span>
              )}
              <span
                className={`text-sm ${
                  item.enabled ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </span>
              {item.fullName && (
                <span className="text-xs text-muted-foreground">
                  ({item.fullName})
                </span>
              )}
              <span className="text-xs font-medium text-primary">
                {item.score}分
                {item.checksPerWeek > 1 && (
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    {item.checksPerWeek}次/周
                  </span>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            {!editingItemId || editingItemId !== item.id ? (
              <>
                <Badge
                  variant={item.enabled ? "default" : "secondary"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleItem(item.id, item.enabled)}
                >
                  {item.enabled ? "启用" : "停用"}
                </Badge>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setEditingItemId(item.id);
                    setEditItemName(item.name);
                    setEditItemFullName(item.fullName || "");
                    setEditItemScore(item.score);
                    setEditItemChecks(item.checksPerWeek);
                  }}
                >
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => deleteItem(item.id)}
                >
                  删除
                </Button>
              </>
            ) : null}
            {(item.children?.length ?? 0) === 0 && (
              <Button
                variant="ghost"
                size="xs"
                className="text-primary hover:bg-primary/10"
                onClick={() => {
                  setAddMode("item");
                  setAddParentId(null);
                  setAddCategoryId(null);
                  // Add as child of this item
                  setAddParentId(item.id);
                  setAddName("");
                  setAddFullName("");
                  setAddScore(0);
                  setAddChecks(1);
                }}
                title="添加子项"
              >
                +子项
              </Button>
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
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => router.push("/admin/activities")}
        >
          &larr; 返回模板列表
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Template info section */}
      <Card>
        <CardContent className="p-4">
          {editingTemplate ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-48 text-lg font-bold"
                />
                <Input
                  type="number"
                  value={editMaxScore}
                  onChange={(e) => setEditMaxScore(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">分</span>
                <Button size="sm" onClick={saveTemplate} disabled={submitting}>
                  {submitting ? "保存中..." : "保存"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(false)}
                >
                  取消
                </Button>
              </div>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="描述（可选）"
                rows={2}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {template.name}
                    <span className="ml-2 text-sm font-normal text-primary">
                      满分 {template.maxScore} 分
                    </span>
                  </h1>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(true)}
                >
                  编辑模板
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {template.enabled ? "当前启用中" : "未启用"}
                </span>
                <span>叶子项合计: {totalScore()} 分</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold">活动项目</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setAddMode("category");
                  setAddCategoryName("");
                }}
              >
                + 添加分类
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  setAddMode("item");
                  setAddParentId(null);
                  setAddCategoryId(null);
                  setAddName("");
                  setAddFullName("");
                  setAddScore(0);
                  setAddChecks(1);
                }}
              >
                + 添加项目
              </Button>
            </div>
          </div>

          {/* Add form */}
          {addMode && (
            <div className="px-4 py-3 bg-muted/50 border-b">
              {addMode === "category" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={addCategoryName}
                    onChange={(e) => setAddCategoryName(e.target.value)}
                    placeholder="分类名称"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addCategory}>
                    创建
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAddMode(null)}>
                    取消
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="名称（如 CX）"
                      className="w-32"
                    />
                    <Input
                      type="text"
                      value={addFullName}
                      onChange={(e) => setAddFullName(e.target.value)}
                      placeholder="全名（如 晨兴）"
                      className="w-32"
                    />
                    <Input
                      type="number"
                      value={addScore}
                      onChange={(e) => setAddScore(parseInt(e.target.value) || 0)}
                      placeholder="分值"
                      className="w-20"
                    />
                    <Input
                      type="number"
                      value={addChecks}
                      onChange={(e) => setAddChecks(parseInt(e.target.value) || 1)}
                      placeholder="周次"
                      className="w-20"
                      title="每周需要完成的次数"
                    />
                    <Select
                      value={addCategoryId ?? "none"}
                      onValueChange={(v) =>
                        setAddCategoryId(!v || v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger size="sm" className="min-w-24">
                        <SelectValue>
                          {(value: string | null) =>
                            !value || value === "none"
                              ? "无分类"
                              : (data.categories.find((cat) => cat.id === value)
                                  ?.name ?? "无分类")
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无分类</SelectItem>
                        {data.categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {addParentId && (
                      <span className="text-xs text-primary">作为子项添加</span>
                    )}
                    <Button size="sm" onClick={addItem}>
                      创建
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddMode(null);
                        setAddParentId(null);
                        setAddCategoryId(null);
                      }}
                    >
                      取消
                    </Button>
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
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="w-40"
                        placeholder="分类名称"
                      />
                      <Button size="xs" onClick={() => saveCategory(cat.id)}>
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setEditingCategoryId(null)}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-foreground">
                        {cat.name}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditCategoryName(cat.name);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => deleteCategory(cat.id)}
                        >
                          删除分类
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                {cat.items.length === 0 ? (
                  <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                    暂无可分类中的项目
                  </div>
                ) : (
                  cat.items.map((item) => renderItem(item))
                )}
              </div>
            ))}

            {data.items.length === 0 && data.categories.every((c) => c.items.length === 0) && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                暂无活动项目，点击上方按钮添加
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
