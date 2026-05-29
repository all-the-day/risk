"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GroupData {
  id: string;
  name: string;
  inviteCode: string;
  disabled: boolean;
  members: {
    id: string;
    nickname: string;
    joinedAt: Date;
    user: { phone: string };
  }[];
}

export default function GroupDetailClient({ group }: { group: GroupData }) {
  const router = useRouter();
  const [disabled, setDisabled] = useState(group.disabled);

  async function toggleDisabled() {
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !disabled }),
    });

    if (res.ok) {
      setDisabled(!disabled);
      router.refresh();
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("确定移除该成员？")) return;

    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 rounded text-xs ${
              disabled
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {disabled ? "已禁用" : "正常"}
          </span>
          <button
            onClick={toggleDisabled}
            className={`px-4 py-2 rounded text-sm font-medium ${
              disabled
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            {disabled ? "启用团体" : "禁用团体"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">
            成员列表 ({group.members.length})
          </h2>
        </div>
        <div className="divide-y">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{member.nickname}</p>
                <p className="text-xs text-gray-500">{member.user.phone}</p>
              </div>
              <button
                onClick={() => removeMember(member.id)}
                className="text-xs text-red-500 hover:underline"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
