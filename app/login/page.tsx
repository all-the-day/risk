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

type FieldName = "nickname" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{
    message: string;
    field?: FieldName;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setError({ message: nicknameError, field: "nickname" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.error || "登录失败" });
        return;
      }
      router.push(data.isAdmin ? "/admin" : "/today");
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
        <h1 className="text-2xl font-bold text-center mb-8">日课</h1>

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
                onChange={(event) => setNickname(event.target.value)}
                placeholder="请输入昵称"
                required
              />
              <FieldDescription>用昵称登录，请不要使用手机号</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-11"
                aria-invalid={error?.field === "password" || undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                required
              />
            </Field>

            {error && (
              <FieldError className="text-center">{error.message}</FieldError>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              登录
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
