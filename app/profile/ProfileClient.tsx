"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileClientProps {
  nickname: string;
  groupName: string;
  inviteCode: string;
}

export default function ProfileClient({
  nickname,
  groupName,
  inviteCode,
}: ProfileClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* User info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {nickname.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800">{nickname}</p>
            <p className="text-sm text-gray-500">{groupName}</p>
          </div>
        </div>
      </div>

      {/* Invite code */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-2">邀请码</h2>
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg tracking-widest text-gray-800">
            {inviteCode}
          </span>
          <button
            onClick={copyInviteCode}
            className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          分享邀请码给其他人，让他们加入你的团体
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleLogout}
          className="w-full py-3 text-center text-red-500 bg-white rounded-xl shadow-sm hover:bg-gray-50"
        >
          退出登录
        </button>
      </div>
    </>
  );
}
