"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MemberDaily {
  userId: string;
  nickname: string;
  done: number;
}

interface GroupClientProps {
  members: MemberDaily[];
  total: number;
  allDone: boolean;
}

export default function GroupClient({ members, total, allDone }: GroupClientProps) {
  return (
    <>
      {allDone ? (
        <Card className="bg-success/30 border-success/30 mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-success-foreground font-medium text-lg">
              今日全员完成
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-warning/30 border-warning/30 mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-warning-foreground font-medium">今日进行中</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">本家今日</h2>
            <span className="text-xs text-muted-foreground">
              共 {total} 项
            </span>
          </div>

          <div className="space-y-3">
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
                        finished ? "bg-success" : "bg-primary"
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
    </>
  );
}
