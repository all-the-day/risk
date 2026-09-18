"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MemberDaily {
  userId: string;
  nickname: string;
  done: number;
}

interface GroupClientProps {
  groupName: string;
  members: MemberDaily[];
  total: number;
  allDone: boolean;
}

export default function GroupClient({
  groupName,
  members,
  total,
  allDone,
}: GroupClientProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>本家今日</CardTitle>
        <CardDescription>
          {groupName} · {members.length} 人 · 每日 {total} 项
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge
          variant={allDone ? "default" : "secondary"}
          className={allDone ? "bg-success text-success-foreground" : ""}
        >
          {allDone ? "全员完成" : "进行中"}
        </Badge>

        <div className="flex flex-col gap-3">
          {members.map((member) => {
            const pct = total > 0 ? (member.done / total) * 100 : 0;
            const finished = total > 0 && member.done === total;
            return (
              <div key={member.userId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{member.nickname}</span>
                  <Badge
                    variant={finished ? "default" : "secondary"}
                    className="text-[11px]"
                  >
                    {member.done}/{total}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      finished ? "bg-success-foreground" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
