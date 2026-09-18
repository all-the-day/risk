"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, MessageSquareIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";

export type AdminFeedback = {
  id: string;
  type: string;
  content: string;
  status: string;
  nickname: string;
  createdAt: string;
};

const FILTERS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "resolved", label: "已处理" },
] as const;

function buildPrompt(feedback: AdminFeedback): string {
  const typeLabel = feedback.type === "bug" ? "Bug 修复" : "功能建议";
  return `# ${typeLabel}

## 反馈内容
${feedback.content}

## 项目上下文
- 项目：日课（rike）——中文打卡小组 App：用户加入一个「家」，每天对 CL 项目逐项打勾，系统按周汇总周分
- 技术栈：Next.js 15 + React 19 + TypeScript + Tailwind v4 + Prisma + SQLite + shadcn/base-ui
- 项目结构：
  - app/：页面与 API 路由（前台 /today /report /group /profile，后台 /admin/*）
  - components/：UI 组件（components/ui 为 shadcn 组件）
  - db/：数据访问层
  - services/：业务逻辑层（打卡、周表聚合、团体）
  - lib/：工具（auth 会话、date 周口径与打卡日、score 计分）
  - prisma/：schema 与种子数据

## 任务
请根据以上反馈内容，分析问题并提供解决方案。如果是 bug，请定位问题所在并修复；如果是功能建议，请评估可行性并实现。
`;
}

export default function FeedbackClient({
  feedbacks,
}: {
  feedbacks: AdminFeedback[];
}) {
  const [items, setItems] = useState(feedbacks);
  const [filter, setFilter] = useState<string>("all");
  const [pending, setPending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFeedback | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [items, filter]
  );

  const pendingCount = items.filter((item) => item.status === "pending").length;

  async function updateStatus(feedback: AdminFeedback, status: string) {
    setPending(feedback.id);
    try {
      const res = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "更新失败");
      }
      setItems((prev) =>
        prev.map((item) => (item.id === feedback.id ? { ...item, status } : item))
      );
      toast.add({
        title: status === "resolved" ? "已标记为已处理" : "已标记为待处理",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "更新失败",
        type: "error",
      });
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setPending(target.id);
    try {
      const res = await fetch(`/api/admin/feedback/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "删除失败");
      }
      setItems((prev) => prev.filter((item) => item.id !== target.id));
      toast.add({ title: "已删除这条反馈", type: "success" });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "删除失败",
        type: "error",
      });
    } finally {
      setPending(null);
    }
  }

  function copyPrompt(feedback: AdminFeedback) {
    navigator.clipboard.writeText(buildPrompt(feedback));
    toast.add({ title: "Prompt 已复制", type: "success" });
  }

  function exportJSON() {
    const data = filtered.map((item) => ({ ...item }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `feedbacks-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.add({ title: `已导出 ${data.length} 条`, type: "success" });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>反馈</CardTitle>
          <CardDescription>
            共 {items.length} 条 · 待处理 {pendingCount} 条
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <DownloadIcon data-icon="inline-start" />
              导出 JSON
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) =>
              setFilter((value as string[])[0] ?? "all")
            }
            variant="outline"
            size="sm"
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareIcon />
              </EmptyMedia>
              <EmptyTitle>
                {filter === "all" ? "还没有反馈" : "这个分类下没有反馈"}
              </EmptyTitle>
              <EmptyDescription>
                成员可以在「我的」页面提交 bug 或建议
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        filtered.map((feedback) => (
          <Card key={feedback.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge
                  variant={feedback.type === "bug" ? "destructive" : "default"}
                >
                  {feedback.type === "bug" ? "Bug" : "建议"}
                </Badge>
                <Badge
                  variant={feedback.status === "pending" ? "secondary" : "outline"}
                >
                  {feedback.status === "pending" ? "待处理" : "已处理"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {feedback.nickname} · {feedback.createdAt}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyPrompt(feedback)}
              >
                复制 Prompt
              </Button>
              <Button
                size="sm"
                variant={feedback.status === "pending" ? "default" : "outline"}
                disabled={pending === feedback.id}
                onClick={() =>
                  updateStatus(
                    feedback,
                    feedback.status === "pending" ? "resolved" : "pending"
                  )
                }
              >
                {pending === feedback.id && <Spinner data-icon="inline-start" />}
                {feedback.status === "pending" ? "标记已处理" : "标记待处理"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(feedback)}
              >
                删除
              </Button>
            </CardFooter>
          </Card>
        ))
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这条反馈？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
