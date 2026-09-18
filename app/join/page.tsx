"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [nickname, setNickname] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "加入失败");
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }

      router.push("/today");
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
        <h1 className="text-2xl font-bold text-center mb-8">加入团体</h1>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "join" | "create");
            setError("");
          }}
          className="mb-6"
        >
          <TabsList className="w-full">
            <TabsTrigger value="join">加入团体</TabsTrigger>
            <TabsTrigger value="create">创建团体</TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <form onSubmit={handleJoin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="join-nickname">团内昵称</FieldLabel>
                  <Input
                    id="join-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="其他成员看到的名字"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="inviteCode">邀请码</FieldLabel>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="font-mono text-center text-lg tracking-widest"
                    placeholder="输入6位邀请码"
                    maxLength={6}
                    required
                  />
                </Field>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Spinner data-icon="inline-start" />}
                  加入团体
                </Button>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreate}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="create-nickname">团内昵称</FieldLabel>
                  <Input
                    id="create-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="其他成员看到的名字"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="groupName">团体名称</FieldLabel>
                  <Input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="给团体起个名字"
                    required
                  />
                </Field>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
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
