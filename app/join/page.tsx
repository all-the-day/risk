"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isPhoneLike, PHONE_HINT } from "@/lib/nickname";

type FieldName = "nickname" | "inviteCode";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [nickname, setNickname] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<{
    message: string;
    field?: FieldName;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // 两个 tab 的昵称框各一个 ref：面板切换时旧节点被卸载会把 ref 置空，
  // 共用一个 ref 会让新面板的焦点丢失
  const joinNicknameRef = useRef<HTMLInputElement>(null);
  const createNicknameRef = useRef<HTMLInputElement>(null);
  const inviteCodeRef = useRef<HTMLInputElement>(null);

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

    if (field === "inviteCode") {
      inviteCodeRef.current?.focus();
      return;
    }
    const ref = mode === "join" ? joinNicknameRef : createNicknameRef;
    ref.current?.focus();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 与服务端 /api/group/join 同一套昵称规则
    if (isPhoneLike(nickname)) {
      fail("nickname", PHONE_HINT);
      return;
    }

    if (inviteCode.length !== 6) {
      fail("inviteCode", "请输入6位邀请码");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ message: data.error || "加入失败" });
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setError({ message: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isPhoneLike(nickname)) {
      fail("nickname", PHONE_HINT);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ message: data.error || "创建失败" });
        return;
      }

      router.push("/today");
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
        <h1 className="text-2xl font-bold text-center mb-8">加入团体</h1>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "join" | "create");
            setError(null);
          }}
          className="mb-6"
        >
          <TabsList className="w-full group-data-horizontal/tabs:h-12">
            <TabsTrigger value="join">加入团体</TabsTrigger>
            <TabsTrigger value="create">创建团体</TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <form onSubmit={handleJoin}>
              <FieldGroup>
                <Field data-invalid={errorOf("nickname") ? true : undefined}>
                  <FieldLabel htmlFor="join-nickname">团内昵称</FieldLabel>
                  <Input
                    id="join-nickname"
                    ref={joinNicknameRef}
                    type="text"
                    className="h-11"
                    aria-invalid={errorOf("nickname") ? true : undefined}
                    aria-describedby={
                      errorOf("nickname") ? "join-nickname-error" : undefined
                    }
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      clearError("nickname");
                    }}
                    placeholder="其他成员看到的名字"
                    required
                  />
                  <FieldError id="join-nickname-error">
                    {errorOf("nickname")}
                  </FieldError>
                </Field>
                <Field data-invalid={errorOf("inviteCode") ? true : undefined}>
                  <FieldLabel htmlFor="inviteCode">邀请码</FieldLabel>
                  <Input
                    id="inviteCode"
                    ref={inviteCodeRef}
                    type="text"
                    aria-invalid={errorOf("inviteCode") ? true : undefined}
                    aria-describedby={
                      errorOf("inviteCode") ? "inviteCode-error" : undefined
                    }
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      clearError("inviteCode");
                    }}
                    className="h-11 font-mono text-center text-lg tracking-widest"
                    placeholder="输入6位邀请码"
                    maxLength={6}
                    required
                  />
                  <FieldError id="inviteCode-error">
                    {errorOf("inviteCode")}
                  </FieldError>
                </Field>
                {error && !error.field && (
                  <FieldError className="text-center">{error.message}</FieldError>
                )}
                <Button type="submit" disabled={loading} className="h-11 w-full">
                  {loading && <Spinner data-icon="inline-start" />}
                  加入团体
                </Button>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreate}>
              <FieldGroup>
                <Field data-invalid={errorOf("nickname") ? true : undefined}>
                  <FieldLabel htmlFor="create-nickname">团内昵称</FieldLabel>
                  <Input
                    id="create-nickname"
                    ref={createNicknameRef}
                    type="text"
                    className="h-11"
                    aria-invalid={errorOf("nickname") ? true : undefined}
                    aria-describedby={
                      errorOf("nickname") ? "create-nickname-error" : undefined
                    }
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      clearError("nickname");
                    }}
                    placeholder="其他成员看到的名字"
                    required
                  />
                  <FieldError id="create-nickname-error">
                    {errorOf("nickname")}
                  </FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="groupName">团体名称</FieldLabel>
                  <Input
                    id="groupName"
                    type="text"
                    className="h-11"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="给团体起个名字"
                    required
                  />
                </Field>
                {error && !error.field && (
                  <FieldError className="text-center">{error.message}</FieldError>
                )}
                <Button type="submit" disabled={loading} className="h-11 w-full">
                  {loading && <Spinner data-icon="inline-start" />}
                  创建团体
                </Button>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
