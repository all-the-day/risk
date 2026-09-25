"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { validateNickname } from "@/lib/nickname";

type FieldName = "nickname" | "password" | "confirmPassword";

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{
    message: string;
    field?: FieldName;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setError({ message: nicknameError, field: "nickname" });
      return;
    }

    if (password !== confirmPassword) {
      setError({ message: "两次密码不一致", field: "confirmPassword" });
      return;
    }

    // 前端密码长度校验（UX优化，后端也会校验）
    if (password.length < 6) {
      setError({ message: "密码至少6位", field: "password" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ message: data.error || "注册失败" });
        return;
      }

      router.push("/join");
      router.refresh();
    } catch {
      setError({ message: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">注册账号</h1>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nickname">昵称</FieldLabel>
              <Input
                id="nickname"
                type="text"
                autoComplete="username"
                className="h-11"
                aria-invalid={error?.field === "nickname" || undefined}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                required
              />
              <FieldDescription>用昵称注册，请不要使用手机号</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                className="h-11"
                aria-invalid={error?.field === "password" || undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">确认密码</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="h-11"
                aria-invalid={error?.field === "confirmPassword" || undefined}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                required
              />
            </Field>
            {error && (
              <FieldError className="text-center">{error.message}</FieldError>
            )}
            <Button type="submit" disabled={loading} className="h-11 w-full">
              {loading && <Spinner data-icon="inline-start" />}
              注册
            </Button>
          </FieldGroup>
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
