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

type FieldName = "nickname" | "password" | "confirmPassword";

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<{
    message: string;
    field?: FieldName;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const fieldRefs = {
    nickname: nicknameRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  /** 字段级错误：只有带 field 的报错才渲染到对应输入框下方 */
  const errorOf = (field: FieldName) =>
    error?.field === field ? error.message : undefined;

  /** 重新编辑某个字段时，清掉挂在该字段上的过期报错 */
  function clearError(field: FieldName) {
    setError((prev) => (prev?.field === field ? null : prev));
  }

  /** 报错并把焦点送到出问题的字段：提交被拦下时，用户不用自己找是哪一项 */
  function fail(field: FieldName, message: string) {
    setError({ message, field });
    fieldRefs[field].current?.focus();
  }

  /** 确认密码失焦时即时比对，不用等提交 */
  function handleConfirmBlur() {
    if (password && confirmPassword && password !== confirmPassword) {
      setError({ message: "两次密码不一致", field: "confirmPassword" });
      return;
    }
    clearError("confirmPassword");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      fail("nickname", nicknameError);
      return;
    }

    // 前端密码长度校验（UX优化，后端也会校验）
    if (password.length < 6) {
      fail("password", "密码至少6位");
      return;
    }

    if (password !== confirmPassword) {
      fail("confirmPassword", "两次密码不一致");
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
                onChange={(e) => {
                  setNickname(e.target.value);
                  clearError("nickname");
                }}
                placeholder="请输入昵称"
                required
              />
              <FieldDescription id="nickname-hint">
                用昵称注册，请不要使用手机号
              </FieldDescription>
              <FieldError id="nickname-error">{errorOf("nickname")}</FieldError>
            </Field>

            <Field data-invalid={errorOf("password") ? true : undefined}>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-full"
                  aria-invalid={errorOf("password") ? true : undefined}
                  aria-describedby={
                    errorOf("password") ? "password-error" : undefined
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  placeholder="请输入密码（至少6位）"
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
              <FieldError id="password-error">{errorOf("password")}</FieldError>
            </Field>

            <Field data-invalid={errorOf("confirmPassword") ? true : undefined}>
              <FieldLabel htmlFor="confirmPassword">确认密码</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-full"
                  aria-invalid={errorOf("confirmPassword") ? true : undefined}
                  aria-describedby={
                    errorOf("confirmPassword")
                      ? "confirmPassword-error"
                      : undefined
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError("confirmPassword");
                  }}
                  onBlur={handleConfirmBlur}
                  placeholder="请再次输入密码"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={
                      showConfirmPassword ? "隐藏确认密码" : "显示确认密码"
                    }
                    aria-pressed={showConfirmPassword}
                    onClick={() => {
                      setShowConfirmPassword((visible) => !visible);
                      confirmPasswordRef.current?.focus();
                    }}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError id="confirmPassword-error">
                {errorOf("confirmPassword")}
              </FieldError>
            </Field>

            {/* 没有具体字段归属的报错（网络、服务端校验）留在表单底部 */}
            {error && !error.field && (
              <FieldError className="text-center">{error.message}</FieldError>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full">
              {loading && <Spinner data-icon="inline-start" />}
              注册
            </Button>
          </FieldGroup>
        </form>
        <p className="text-center mt-6 text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
