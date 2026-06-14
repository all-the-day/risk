"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature">("bug");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  async function submitFeedback() {
    if (!feedbackContent.trim()) {
      setError("请输入反馈内容");
      return;
    }
    setError(null);
    setFeedbackLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: feedbackType, content: feedbackContent }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackContent("");
        setTimeout(() => {
          setShowFeedback(false);
          setFeedbackSuccess(false);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "提交失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setFeedbackLoading(false);
    }
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
        <Link
          href="/report"
          className="block w-full py-3 text-center text-blue-500 bg-white rounded-xl shadow-sm hover:bg-gray-50"
        >
          周报告
        </Link>
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full py-3 text-center text-blue-500 bg-white rounded-xl shadow-sm hover:bg-gray-50"
        >
          意见反馈
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-3 text-center text-red-500 bg-white rounded-xl shadow-sm hover:bg-gray-50"
        >
          退出登录
        </button>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            {feedbackSuccess ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">感谢反馈！</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">意见反馈</h2>
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFeedbackType("bug")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      feedbackType === "bug"
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Bug 反馈
                  </button>
                  <button
                    onClick={() => setFeedbackType("feature")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      feedbackType === "feature"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    功能建议
                  </button>
                </div>

                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="请描述你遇到的问题或建议..."
                  className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}

                <button
                  onClick={submitFeedback}
                  disabled={feedbackLoading}
                  className="w-full mt-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {feedbackLoading ? "提交中..." : "提交"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
