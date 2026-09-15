"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    // 前端密码长度校验（UX优化，后端也会校验）
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      router.push("/join");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">注册账号</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>
        <p className="text-center mt-4 text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
