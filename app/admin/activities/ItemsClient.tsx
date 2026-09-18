"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { formatAllowedWeekdays } from "@/lib/date";
import type { AdminItem, DeletedItem } from "./page";

type FormState = {
  id: string | null;
  name: string;
  score: string;
  checksPerWeek: string;
  weekdays: string; // "any" | "0"
  scope: string; // "personal" | "group"
  enabled: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  score: "0",
  checksPerWeek: "1",
  weekdays: "any",
  scope: "personal",
  enabled: true,
};

export default function ItemsClient({
  items,
  deletedItems,
}: {
  items: AdminItem[];
  deletedItems: DeletedItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);

  const enabledTotal = useMemo(
    () =>
      items
        .filter((item) => item.enabled)
        .reduce((sum, item) => sum + item.score, 0),
    [items]
  );

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, query]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setReadOnly(false);
    setSheetOpen(true);
  }

  function openEdit(item: AdminItem) {
    setForm({
      id: item.id,
      name: item.name,
      score: String(item.score),
      checksPerWeek: String(item.checksPerWeek),
      weekdays: item.allowedWeekdays ?? "any",
      scope: item.scope,
      enabled: item.enabled,
    });
    setReadOnly(false);
    setSheetOpen(true);
  }

  function openView(item: AdminItem) {
    openEdit(item);
    setReadOnly(true);
  }

  async function patch(itemId: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/activities/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "操作失败");
    }
  }

  async function save() {
    const name = form.name.trim();
    if (!name) {
      toast.add({ title: "请填写名称", type: "error" });
      return;
    }
    const score = Number(form.score);
    const checks = Number(form.checksPerWeek);
    if (!Number.isInteger(score) || score < 0) {
      toast.add({ title: "分值要填 0 或正整数", type: "error" });
      return;
    }
    if (!Number.isInteger(checks) || checks < 1) {
      toast.add({ title: "每周次数至少 1 次", type: "error" });
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      score,
      checksPerWeek: checks,
      allowedWeekdays: form.weekdays === "any" ? null : form.weekdays,
      scope: form.scope,
      enabled: form.enabled,
    };

    setSaving(true);
    try {
      if (form.id) {
        await patch(form.id, payload);
      } else {
        const res = await fetch("/api/admin/activities/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "创建失败");
        }
      }
      toast.add({
        title: form.id ? "已保存" : `已新增「${name}」`,
        type: "success",
      });
      setSheetOpen(false);
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "保存失败",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(item: AdminItem, checked: boolean) {
    setPendingId(item.id);
    try {
      await patch(item.id, { enabled: checked });
      toast.add({
        title: `${item.name} 已${checked ? "启用" : "停用"}`,
        type: "success",
      });
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "操作失败",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function move(item: AdminItem, direction: -1 | 1) {
    const index = items.findIndex((row) => row.id === item.id);
    const target = items[index + direction];
    if (!target) return;

    setPendingId(item.id);
    try {
      await Promise.all([
        patch(item.id, { order: target.order }),
        patch(target.id, { order: item.order }),
      ]);
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "调整顺序失败",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setPendingId(target.id);
    try {
      const res = await fetch(`/api/admin/activities/items/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "删除失败");
      }
      toast.add({ title: `已删除「${target.name}」，可随时恢复`, type: "success" });
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "删除失败",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function restore(item: DeletedItem) {
    setPendingId(item.id);
    try {
      await patch(item.id, { restore: true });
      toast.add({ title: `已恢复「${item.name}」`, type: "success" });
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "恢复失败",
        type: "error",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>项目管理</CardTitle>
          <CardDescription>
            满分 {enabledTotal} 分 · 共 {items.length} 项
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {(deletedItems.length > 0 || showDeleted) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleted((prev) => !prev)}
                >
                  {showDeleted ? "返回项目列表" : `已删除 ${deletedItems.length}`}
                </Button>
              )}
              <Button size="sm" onClick={openCreate}>
                <PlusIcon data-icon="inline-start" />
                新增项目
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!showDeleted && (
            <InputGroup className="w-full sm:w-56">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索项目"
              />
            </InputGroup>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl bg-card">
        {showDeleted ? (
          deletedItems.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListIcon />
                </EmptyMedia>
                <EmptyTitle>回收站是空的</EmptyTitle>
                <EmptyDescription>删除的项目会出现在这里，可以随时恢复</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>已删除的项目</TableHead>
                  <TableHead>删除日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {item.deletedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === item.id}
                        onClick={() => restore(item)}
                      >
                        恢复
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListIcon />
              </EmptyMedia>
              <EmptyTitle>还没有项目</EmptyTitle>
              <EmptyDescription>
                项目就是每天要打卡的事，比如 CX（6 分 / 一周 3 次）
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openCreate}>
                <PlusIcon data-icon="inline-start" />
                新增项目
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目</TableHead>
                <TableHead>分值</TableHead>
                <TableHead>次数/周</TableHead>
                <TableHead>打卡日</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => openView(item)}
                      className={`font-medium hover:underline ${
                        item.enabled ? "" : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </button>
                  </TableCell>
                  <TableCell className="tabular-nums">{item.score} 分</TableCell>
                  <TableCell className="tabular-nums">
                    {item.checksPerWeek} 次
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatAllowedWeekdays(item.allowedWeekdays)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.scope === "group" ? "secondary" : "outline"}
                    >
                      {item.scope === "group" ? "团体" : "个人"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.enabled}
                      disabled={pendingId === item.id}
                      onCheckedChange={(checked) => toggleEnabled(item, checked)}
                      aria-label={`${item.name} 启用状态`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => move(item, -1)}
                        aria-label="上移"
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => move(item, 1)}
                        aria-label="下移"
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(item)}
                        aria-label="编辑"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                        aria-label="删除"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {readOnly ? form.name : form.id ? "编辑项目" : "新增项目"}
            </SheetTitle>
            <SheetDescription>
              {readOnly ? "查看项目规则" : "保存后满分自动重算"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="item-name">名称</FieldLabel>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="如 XP"
                  disabled={readOnly}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-score">分值</FieldLabel>
                <Input
                  id="item-score"
                  inputMode="numeric"
                  value={form.score}
                  onChange={(event) => setField("score", event.target.value)}
                  disabled={readOnly}
                />
                <FieldDescription>该项每周满分</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="item-checks">每周次数</FieldLabel>
                <Input
                  id="item-checks"
                  inputMode="numeric"
                  value={form.checksPerWeek}
                  onChange={(event) =>
                    setField("checksPerWeek", event.target.value)
                  }
                  disabled={readOnly}
                />
                <FieldDescription>
                  达到这个次数算满分，多做不额外加分
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>打卡日</FieldLabel>
                <ToggleGroup
                  value={[form.weekdays]}
                  onValueChange={(value) =>
                    setField("weekdays", (value as string[])[0] ?? "any")
                  }
                  variant="outline"
                  size="sm"
                  disabled={readOnly}
                >
                  <ToggleGroupItem value="any">不限</ToggleGroupItem>
                  <ToggleGroupItem value="0">仅主日</ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  选了「仅主日」，其他日子打卡页不会出现这项
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>类型</FieldLabel>
                <ToggleGroup
                  value={[form.scope]}
                  onValueChange={(value) =>
                    setField("scope", (value as string[])[0] ?? "personal")
                  }
                  variant="outline"
                  size="sm"
                  disabled={readOnly}
                >
                  <ToggleGroupItem value="personal">个人</ToggleGroupItem>
                  <ToggleGroupItem value="group">团体</ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="item-enabled">启用</FieldLabel>
                <Switch
                  id="item-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) => setField("enabled", checked)}
                  disabled={readOnly}
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            {readOnly ? (
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                关闭
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  取消
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Spinner data-icon="inline-start" />}
                  保存
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除「{deleteTarget?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后这项不再出现在打卡页，满分会自动重算；打卡记录会保留，之后可以恢复。
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
