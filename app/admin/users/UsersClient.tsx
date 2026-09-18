"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";

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

export type AdminUser = {
  id: string;
  nickname: string;
  isAdmin: boolean;
  createdAt: string;
  groups: string[];
};

export default function UsersClient({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [newNickname, setNewNickname] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const [passwordDraft, setPasswordDraft] = useState("");

  const active = users.find((user) => user.id === activeId) ?? null;

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      user.nickname.toLowerCase().includes(keyword)
    );
  }, [users, query]);

  async function patchUser(
    userId: string,
    data: Record<string, unknown>,
    pendingKey: string
  ) {
    setPending(pendingKey);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
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

  async function createUser() {
    const nickname = newNickname.trim();
    if (!nickname) {
      toast.add({ title: "请填写昵称", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      toast.add({ title: "密码至少 6 位", type: "error" });
      return;
    }
    setPending("create");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          password: newPassword,
          isAdmin: newIsAdmin,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "创建失败");
      }
      toast.add({ title: `已创建「${nickname}」`, type: "success" });
      setCreateOpen(false);
      setNewNickname("");
      setNewPassword("");
      setNewIsAdmin(false);
      router.refresh();
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "创建失败",
        type: "error",
      });
    } finally {
      setPending(null);
    }
  }

  async function toggleAdmin(user: AdminUser, isAdmin: boolean) {
    if (await patchUser(user.id, { isAdmin }, "admin")) {
      toast.add({
        title: `「${user.nickname}」已${isAdmin ? "设为管理员" : "改为普通用户"}`,
        type: "success",
      });
      router.refresh();
    }
  }

  async function resetPassword() {
    if (!active) return;
    if (passwordDraft.length < 6) {
      toast.add({ title: "密码至少 6 位", type: "error" });
      return;
    }
    if (await patchUser(active.id, { password: passwordDraft }, "password")) {
      toast.add({ title: `已重置「${active.nickname}」的密码`, type: "success" });
      setPasswordDraft("");
    }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setPending("delete");
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "删除失败");
      }
      toast.add({ title: `已删除「${target.nickname}」`, type: "success" });
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
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>用户</CardTitle>
          <CardDescription>共 {users.length} 个账号</CardDescription>
          <CardAction>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              新增用户
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <InputGroup className="w-full sm:w-56">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索昵称"
            />
          </InputGroup>
        </CardContent>
      </Card>

      <div className="rounded-xl bg-card">
        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>没有匹配的用户</EmptyTitle>
              <EmptyDescription>换个关键词试试</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>所属团体</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {user.nickname}
                        {isSelf && <Badge variant="outline">我自己</Badge>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "管理员" : "普通用户"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.groups.length > 0 ? user.groups.join("、") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveId(user.id);
                            setPasswordDraft("");
                          }}
                        >
                          <SettingsIcon data-icon="inline-start" />
                          管理
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 新增用户 */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>新增用户</SheetTitle>
            <SheetDescription>
              管理员代建账号；成员也可以自己在前台注册
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-nickname">昵称</FieldLabel>
                <Input
                  id="new-nickname"
                  value={newNickname}
                  onChange={(event) => setNewNickname(event.target.value)}
                  placeholder="2-20 个字，不能是手机号"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">初始密码</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="至少 6 位"
                />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="new-admin">设为管理员</FieldLabel>
                <Switch
                  id="new-admin"
                  checked={newIsAdmin}
                  onCheckedChange={setNewIsAdmin}
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={createUser} disabled={pending === "create"}>
              {pending === "create" && <Spinner data-icon="inline-start" />}
              创建
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 管理用户 */}
      <Sheet
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{active?.nickname ?? ""}</SheetTitle>
            <SheetDescription>
              注册于 {active?.createdAt}
              {active && active.groups.length > 0
                ? ` · ${active.groups.join("、")}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          {active && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="user-admin">管理员</FieldLabel>
                  <Switch
                    id="user-admin"
                    checked={active.isAdmin}
                    disabled={pending === "admin"}
                    onCheckedChange={(checked) => toggleAdmin(active, checked)}
                  />
                </Field>

                <Separator />

                <Field>
                  <FieldLabel htmlFor="user-password">重置密码</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="user-password"
                      type="password"
                      value={passwordDraft}
                      onChange={(event) => setPasswordDraft(event.target.value)}
                      placeholder="新密码（至少 6 位）"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending === "password" || !passwordDraft}
                      onClick={resetPassword}
                    >
                      {pending === "password" && (
                        <Spinner data-icon="inline-start" />
                      )}
                      重置
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </div>
          )}

          <SheetFooter className="flex-row justify-between gap-2 border-t">
            <Button
              variant="destructive"
              onClick={() => active && setDeleteTarget(active)}
            >
              删除用户
            </Button>
            <Button variant="outline" onClick={() => setActiveId(null)}>
              关闭
            </Button>
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
            <AlertDialogTitle>
              删除用户「{deleteTarget?.nickname}」？
            </AlertDialogTitle>
            <AlertDialogDescription>
              加入关系、打卡记录、周分与反馈会一并删除，不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={removeUser}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
