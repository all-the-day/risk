"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface GroupData {
  id: string;
  name: string;
  inviteCode: string;
  disabled: boolean;
  members: {
    id: string;
    nickname: string;
    joinedAt: Date;
    user: { nickname: string };
  }[];
}

export default function GroupDetailClient({ group }: { group: GroupData }) {
  const router = useRouter();
  const [disabled, setDisabled] = useState(group.disabled);
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string | null>(null);

  async function toggleDisabled() {
    setError(null);
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !disabled }),
    });

    if (res.ok) {
      setDisabled(!disabled);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function renameGroup() {
    if (!name.trim() || name.trim() === group.name) return;
    setError(null);
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "保存失败");
    }
  }

  async function regenerateCode() {
    if (!confirm("确定重置邀请码？旧邀请码将立即失效。")) return;
    setError(null);
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateCode: true }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  async function deleteGroup() {
    if (
      !confirm(
        `确定删除团体「${group.name}」？${group.members.length} 位成员的加入关系与已录入的周分会一并删除（打卡记录保留），不可恢复。`
      )
    )
      return;
    setError(null);
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      router.push("/admin/groups");
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("确定移除该成员？")) return;
    setError(null);

    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "操作失败");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs"
              aria-label="团体名称"
            />
            {name.trim() !== group.name && (
              <Button size="sm" onClick={renameGroup}>
                保存名称
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">邀请码</span>
            <span className="font-mono tracking-widest font-medium">
              {group.inviteCode}
            </span>
            <Button variant="outline" size="xs" onClick={regenerateCode}>
              重置邀请码
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant={disabled ? "destructive" : "default"}>
              {disabled ? "已禁用" : "正常"}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant={disabled ? "default" : "outline"}
                onClick={toggleDisabled}
              >
                {disabled ? "启用团体" : "禁用团体"}
              </Button>
              <Button variant="destructive" onClick={deleteGroup}>
                删除团体
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold">
              成员列表 ({group.members.length})
            </h2>
          </div>
          {group.members.map((member, i) => (
            <div key={member.id}>
              {i > 0 && <div className="border-t" />}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{member.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.nickname}
                  </p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeMember(member.id)}
                >
                  移除
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
