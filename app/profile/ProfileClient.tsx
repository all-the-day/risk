"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Copy, MessageSquare, LogOut, BarChart3, UserPen, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProfileClientProps {
  nickname: string;
  membershipId: string;
  groupName: string;
  groupId: string;
  inviteCode: string;
}

export default function ProfileClient({
  nickname,
  membershipId,
  groupName,
  groupId,
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

  // 修改家内昵称
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState(nickname);
  const [renaming, setRenaming] = useState(false);

  async function submitRename() {
    if (!renameValue.trim()) {
      setError("请输入新昵称");
      return;
    }
    setError(null);
    setRenaming(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: renameValue, membershipId }),
      });
      if (res.ok) {
        setShowRename(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setRenaming(false);
    }
  }

  async function leaveGroup() {
    if (
      !confirm(
        `确定退出「${groupName}」？退出后需要重新输入邀请码才能回来，你的打卡记录会保留。`
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch("/api/group/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (res.ok) {
        // 退出后本页会因没有团体而重定向到 /join
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "退出失败");
      }
    } catch {
      setError("网络错误");
    }
  }

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
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">
                {nickname.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg">{nickname}</p>
              <p className="text-sm text-muted-foreground">{groupName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite code card */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            邀请码
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl tracking-widest font-medium">
              {inviteCode}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteCode}
              className="gap-1.5"
            >
              <Copy className="size-3.5" />
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            分享邀请码给其他人，让他们加入你的团体
          </p>
        </CardContent>
      </Card>

      {/* Menu list */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <Link
            href="/report"
            className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm">周报告</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <div className="border-t" />
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span className="text-sm">意见反馈</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <div className="border-t" />
          <button
            onClick={() => {
              setRenameValue(nickname);
              setShowRename(true);
            }}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserPen className="size-4 text-muted-foreground" />
              <span className="text-sm">修改家内昵称</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <div className="border-t" />
          <button
            onClick={leaveGroup}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserMinus className="size-4 text-destructive" />
              <span className="text-sm text-destructive">退出团体</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Logout button */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full text-muted-foreground hover:text-destructive gap-2"
        size="sm"
      >
        <LogOut className="size-4" />
        退出登录
      </Button>

      {/* Rename dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改家内昵称</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="rename-nickname">
              在「{groupName}」中显示的昵称
            </Label>
            <Input
              id="rename-nickname"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="2-20 个字，不能是手机号"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>
              取消
            </Button>
            <Button onClick={submitRename} disabled={renaming}>
              {renaming ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          {feedbackSuccess ? (
            <div className="text-center py-4">
              <p className="text-success-foreground font-medium">感谢反馈！</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>意见反馈</DialogTitle>
              </DialogHeader>

              <div className="flex gap-2">
                <Button
                  variant={feedbackType === "bug" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setFeedbackType("bug")}
                >
                  Bug 反馈
                </Button>
                <Button
                  variant={
                    feedbackType === "feature" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setFeedbackType("feature")}
                >
                  功能建议
                </Button>
              </div>

              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="请描述你遇到的问题或建议..."
                className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={submitFeedback}
                  disabled={feedbackLoading}
                >
                  {feedbackLoading ? "提交中..." : "提交"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
