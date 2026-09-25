"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{
    message: string;
    field?: FieldName;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fieldRefs = { nickname: nicknameRef, password: passwordRef };

  /** 字段级错误：只有带 field 的报错才渲染到对应输入框下方 */
  const errorOf = (field: FieldName) =>
    error?.field === field ? error.message : undefined;

  /** 报错并把焦点送到出问题的字段：提交被拦下时，用户不用自己找是哪一项 */
  function fail(field: FieldName, message: string) {
    setError({ message, field });
    fieldRefs[field].current?.focus();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      fail("nickname", nicknameError);
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
        // 「昵称或密码错误」同时涉及两个字段，只适合做表单级提示
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
            <Field data-invalid={errorOf("nickname") ? true : undefined}>
              <FieldLabel htmlFor="nickname">昵称</FieldLabel>
              <Input
                id="nickname"
                ref={nicknameRef}
                type="text"
                autoComplete="username"
                className="h-11"
                aria-invalid={errorOf("nickname") ? true : undefined}
                aria-describedby={
                  errorOf("nickname")
                    ? "nickname-hint nickname-error"
                    : "nickname-hint"
                }
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setError((prev) => (prev?.field === "nickname" ? null : prev));
                }}
                placeholder="请输入昵称"
                required
              />
              <FieldDescription id="nickname-hint">
                用昵称登录，请不要使用手机号
              </FieldDescription>
              <FieldError id="nickname-error">{errorOf("nickname")}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-full"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    onClick={() => {
                      setShowPassword((visible) => !visible);
                      // 点按钮会把焦点带走，切完还给输入框才能接着打字
                      passwordRef.current?.focus();
                    }}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {error && !error.field && (
              <FieldError className="text-center">{error.message}</FieldError>
            )}

            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              登录
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
