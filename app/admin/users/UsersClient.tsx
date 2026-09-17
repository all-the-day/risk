"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface UserData {
  id: string;
  nickname: string;
  isAdmin: boolean;
  createdAt: Date;
  memberships: {
    id: string;
    group: { id: string; name: string };
  }[];
}

export default function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserData[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // 新增用户
  const [showCreate, setShowCreate] = useState(false);
  const [createNickname, setCreateNickname] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createIsAdmin, setCreateIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  async function createUser() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: createNickname,
          password: createPassword,
          isAdmin: createIsAdmin,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateNickname("");
        setCreatePassword("");
        setCreateIsAdmin(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "创建失败");
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(user: UserData) {
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function resetPassword(user: UserData) {
    const password = prompt(`为「${user.nickname}」设置新密码（至少6位）：`);
    if (password === null) return;
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setError(null);
      alert("密码已重置");
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function deleteUser(user: UserData) {
    if (
      !confirm(
        `确定删除用户「${user.nickname}」？其加入关系、打卡记录、周分与反馈将一并删除，不可恢复。`
      )
    )
      return;
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          新增用户
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                昵称
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                角色
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                所属团体
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                注册时间
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    {user.nickname}
                    {isSelf && (
                      <span className="text-xs text-muted-foreground ml-1.5">
                        （我）
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "管理员" : "普通用户"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.memberships.length > 0
                      ? user.memberships.map((m) => m.group.name).join(", ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="link"
                          size="xs"
                          onClick={() => toggleAdmin(user)}
                        >
                          {user.isAdmin ? "设为普通" : "设为管理员"}
                        </Button>
                        <Button
                          variant="link"
                          size="xs"
                          onClick={() => resetPassword(user)}
                        >
                          重置密码
                        </Button>
                        <Button
                          variant="link"
                          size="xs"
                          className="text-destructive"
                          onClick={() => deleteUser(user)}
                        >
                          删除
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-nickname">昵称</Label>
              <Input
                id="create-nickname"
                value={createNickname}
                onChange={(e) => setCreateNickname(e.target.value)}
                placeholder="2-20 个字，不能是手机号"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">初始密码</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="至少 6 位"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="create-admin"
                checked={createIsAdmin}
                onCheckedChange={setCreateIsAdmin}
              />
              <Label htmlFor="create-admin">设为管理员</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={createUser} disabled={creating}>
              {creating ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
