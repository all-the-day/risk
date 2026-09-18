"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, PencilIcon, SearchIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import type { AdminGroup } from "./page";

type ConfirmState = {
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
};

export default function GroupsClient({ groups }: { groups: AdminGroup[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const active = groups.find((group) => group.id === activeId) ?? null;

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(keyword)
    );
  }, [groups, query]);

  function openGroup(group: AdminGroup) {
    setActiveId(group.id);
    setNameDraft(group.name);
  }

  async function patchGroup(
    groupId: string,
    data: Record<string, unknown>,
    pendingKey: string
  ) {
    setPending(pendingKey);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "操作失败");
      }
      return true;
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "操作失败",
        type: "error",
      });
      return false;
    } finally {
      setPending(null);
    }
  }

  async function saveName() {
    if (!active) return;
    const name = nameDraft.trim();
    if (!name || name === active.name) return;
    if (await patchGroup(active.id, { name }, "name")) {
      toast.add({ title: "团体名已更新", type: "success" });
      router.refresh();
    }
  }

  async function toggleDisabled(next: boolean) {
    if (!active) return;
    if (await patchGroup(active.id, { disabled: next }, "disabled")) {
      toast.add({
        title: next ? `已禁用「${active.name}」` : `已启用「${active.name}」`,
        type: "success",
      });
      router.refresh();
    }
  }

  function copyInviteCode(group: AdminGroup) {
    navigator.clipboard.writeText(group.inviteCode);
    toast.add({ title: "邀请码已复制", type: "success" });
  }

  function askResetCode() {
    if (!active) return;
    setConfirm({
      title: "重置邀请码？",
      description: "旧邀请码会立刻失效，已经加入的成员不受影响。",
      confirmText: "重置",
      onConfirm: async () => {
        if (await patchGroup(active.id, { regenerateCode: true }, "code")) {
          toast.add({ title: "邀请码已重置", type: "success" });
          router.refresh();
        }
      },
    });
  }

  function askSetLeader(memberId: string, nickname: string) {
    if (!active) return;
    setConfirm({
      title: `把「${nickname}」设为团长？`,
      description: "团长能看到全家数据，一家同时只有一个团长。",
      confirmText: "设为团长",
      onConfirm: async () => {
        if (await patchGroup(active.id, { leaderMemberId: memberId }, "leader")) {
          toast.add({ title: `「${nickname}」已是团长`, type: "success" });
          router.refresh();
        }
      },
    });
  }

  function askRemoveMember(memberId: string, nickname: string) {
    if (!active) return;
    setConfirm({
      title: `移除成员「${nickname}」？`,
      description: "移除后他需要重新输入邀请码才能回来，打卡记录会保留。",
      confirmText: "移除",
      onConfirm: async () => {
        setPending("member");
        try {
          const res = await fetch(`/api/admin/groups/${active.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? "移除失败");
          }
          toast.add({ title: `已移除「${nickname}」`, type: "success" });
          router.refresh();
        } catch (error) {
          toast.add({
            title: error instanceof Error ? error.message : "移除失败",
            type: "error",
          });
        } finally {
          setPending(null);
        }
      },
    });
  }

  function askDeleteGroup() {
    if (!active) return;
    const group = active;
    setConfirm({
      title: `删除团体「${group.name}」？`,
      description: `${group.members.length} 位成员的加入关系和已录入的周分会一并删除（打卡记录保留），不可恢复。`,
      confirmText: "删除团体",
      onConfirm: async () => {
        setPending("delete");
        try {
          const res = await fetch(`/api/admin/groups/${group.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? "删除失败");
          }
          toast.add({ title: `已删除「${group.name}」`, type: "success" });
          setActiveId(null);
          router.refresh();
        } catch (error) {
          toast.add({
            title: error instanceof Error ? error.message : "删除失败",
            type: "error",
          });
        } finally {
          setPending(null);
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>团体</CardTitle>
          <CardDescription>共 {groups.length} 个家</CardDescription>
        </CardHeader>
        <CardContent>
          <InputGroup className="w-full sm:w-56">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索团体"
            />
          </InputGroup>
        </CardContent>
      </Card>

      <div className="rounded-xl bg-card">
        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>{query ? "没有匹配的团体" : "还没有家"}</EmptyTitle>
              <EmptyDescription>
                {query
                  ? "换个关键词试试"
                  : "成员在前台用邀请码创建或加入家之后，会出现在这里"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>邀请码</TableHead>
                <TableHead>成员</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {group.inviteCode}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {group.members.length} 人
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.disabled ? "destructive" : "secondary"}>
                      {group.disabled ? "已禁用" : "正常"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {group.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openGroup(group)}
                    >
                      <PencilIcon data-icon="inline-start" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{active?.name ?? ""}</SheetTitle>
            <SheetDescription>
              邀请码 {active?.inviteCode} · {active?.members.length ?? 0} 位成员
            </SheetDescription>
          </SheetHeader>

          {active && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="group-name">团体名称</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="group-name"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        pending === "name" || nameDraft.trim() === active.name
                      }
                      onClick={saveName}
                    >
                      {pending === "name" && <Spinner data-icon="inline-start" />}
                      保存
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>邀请码</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tracking-widest">
                      {active.inviteCode}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteCode(active)}
                    >
                      <CopyIcon data-icon="inline-start" />
                      复制
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending === "code"}
                      onClick={askResetCode}
                    >
                      重置
                    </Button>
                  </div>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="group-disabled">启用</FieldLabel>
                  <Switch
                    id="group-disabled"
                    checked={!active.disabled}
                    disabled={pending === "disabled"}
                    onCheckedChange={(checked) => toggleDisabled(!checked)}
                  />
                </Field>
              </FieldGroup>

              <Separator className="my-4" />

              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">
                  成员（{active.members.length}）
                </h3>
                {active.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {member.nickname}
                      </span>
                      {member.nickname !== member.loginName && (
                        <span className="text-xs text-muted-foreground">
                          登录名 {member.loginName}
                        </span>
                      )}
                      {member.role === "leader" && <Badge>团长</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      {member.role !== "leader" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            askSetLeader(member.id, member.nickname)
                          }
                        >
                          设为团长
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          askRemoveMember(member.id, member.nickname)
                        }
                      >
                        移除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SheetFooter className="flex-row justify-between gap-2 border-t">
            <Button
              variant="destructive"
              disabled={pending === "delete"}
              onClick={askDeleteGroup}
            >
              {pending === "delete" && <Spinner data-icon="inline-start" />}
              删除团体
            </Button>
            <Button variant="outline" onClick={() => setActiveId(null)}>
              关闭
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = confirm?.onConfirm;
                setConfirm(null);
                void action?.();
              }}
            >
              {confirm?.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
