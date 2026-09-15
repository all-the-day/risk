"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TaskStatusItem {
  taskId: string;
  taskTitle: string;
  completedCount: number;
  totalMembers: number;
  allDone: boolean;
}

interface GroupClientProps {
  taskStatus: TaskStatusItem[];
  allDone: boolean;
}

export default function GroupClient({
  taskStatus,
  allDone,
}: GroupClientProps) {
  return (
    <>
      {/* Status banner */}
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

      {/* Task progress */}
      <div className="space-y-4">
        {taskStatus.map((task) => {
          const percentage =
            task.totalMembers > 0
              ? Math.round((task.completedCount / task.totalMembers) * 100)
              : 0;

          return (
            <Card key={task.taskId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{task.taskTitle}</h3>
                  <Badge variant={task.allDone ? "default" : "secondary"}>
                    {task.completedCount}/{task.totalMembers}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      task.allDone ? "bg-success" : "bg-primary"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Status text */}
                <p
                  className={`text-xs mt-2 ${
                    task.allDone
                      ? "text-success-foreground font-medium"
                      : "text-warning-foreground"
                  }`}
                >
                  {task.allDone
                    ? "已完成"
                    : `还差 ${task.totalMembers - task.completedCount} 人`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
