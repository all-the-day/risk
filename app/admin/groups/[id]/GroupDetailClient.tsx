"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Badge variant={disabled ? "destructive" : "default"}>
              {disabled ? "已禁用" : "正常"}
            </Badge>
            <Button
              variant={disabled ? "default" : "destructive"}
              onClick={toggleDisabled}
            >
              {disabled ? "启用团体" : "禁用团体"}
            </Button>
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
