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
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create form */}
      <Card>
        <CardContent className="p-4">
          {showCreate ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="模板名称"
                />
                <Select
                  value={newTemplate.period}
                  onValueChange={(v) =>
                    setNewTemplate((prev) => ({ ...prev, period: v || "weekly" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">每日</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="monthly">每月</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="描述（可选）"
                />
                <Input
                  type="number"
                  value={newTemplate.maxScore}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      maxScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="满分"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTemplate} size="sm">
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
            <Button onClick={() => setShowCreate(true)} size="sm">
              + 新增模板
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Template list */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">模板列表</h2>
          </div>
          <div className="divide-y">
            {templates.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                暂无模板
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/admin/activities/${tpl.id}`)}
                  >
                    <span className="text-sm font-medium text-foreground">
                      {tpl.name}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {periodLabels[tpl.period] || tpl.period}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        满分 {tpl.maxScore}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tpl._count?.items ?? 0} 项
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => router.push(`/admin/activities/${tpl.id}`)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="bg-success/30 text-success-foreground hover:bg-success/50"
                      onClick={() => activateTemplate(tpl.id, tpl.name)}
                      disabled={activatingId === tpl.id}
                    >
                      {activatingId === tpl.id ? "启用中..." : "启用"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => deleteTemplate(tpl.id, tpl.name)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
