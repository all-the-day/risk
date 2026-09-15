"use client";

import { useState } from "react";
import CheckinButton from "@/components/CheckinButton";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TaskStatus {
  taskId: string;
  taskTitle: string;
  taskType: string;
  checked: boolean;
  checkedAt: string | null;
}

interface TodayClientProps {
  groupTasks: TaskStatus[];
  personalTasks: TaskStatus[];
}

export default function TodayClient({
  groupTasks: initialGroupTasks,
  personalTasks: initialPersonalTasks,
}: TodayClientProps) {
  const [groupTasks, setGroupTasks] = useState(initialGroupTasks);
  const [personalTasks, setPersonalTasks] = useState(initialPersonalTasks);

  function handleToggle(taskId: string, checked: boolean) {
    setGroupTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, checked } : t))
    );
    setPersonalTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, checked } : t))
    );
  }

  const groupDone = groupTasks.filter((t) => t.checked).length;
  const personalDone = personalTasks.filter((t) => t.checked).length;
  const groupTotal = groupTasks.length;
  const personalTotal = personalTasks.length;
  const groupPct = groupTotal > 0 ? (groupDone / groupTotal) * 100 : 0;
  const personalPct = personalTotal > 0 ? (personalDone / personalTotal) * 100 : 0;

  return (
    <>
      {/* Group tasks */}
      <section className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">团体事项</h2>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      groupPct === 100 ? "bg-success-foreground" : "bg-primary"
                    }`}
                    style={{ width: `${groupPct}%` }}
                  />
                </div>
                <Badge variant="secondary" className="text-[11px]">
                  {groupDone}/{groupTotal}
                </Badge>
              </div>
            </div>
            {groupTasks.map((task, i) => (
              <div key={task.taskId}>
                {i > 0 && <Separator className="my-0" />}
                <div className="flex items-center justify-between py-2.5">
                  <span
                    className={
                      task.checked
                        ? "text-muted-foreground/60 line-through text-sm"
                        : "text-foreground text-sm"
                    }
                  >
                    {task.taskTitle}
                  </span>
                  <CheckinButton
                    taskId={task.taskId}
                    checked={task.checked}
                    onToggle={handleToggle}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Personal tasks */}
      {personalTasks.length > 0 && (
        <section className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">个人事项</h2>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        personalPct === 100
                          ? "bg-success-foreground"
                          : "bg-primary"
                      }`}
                      style={{ width: `${personalPct}%` }}
                    />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {personalDone}/{personalTotal}
                  </Badge>
                </div>
              </div>
              {personalTasks.map((task, i) => (
                <div key={task.taskId}>
                  {i > 0 && <Separator className="my-0" />}
                  <div className="flex items-center justify-between py-2.5">
                    <span
                      className={
                        task.checked
                          ? "text-muted-foreground/60 line-through text-sm"
                          : "text-foreground text-sm"
                      }
                    >
                      {task.taskTitle}
                    </span>
                    <CheckinButton
                      taskId={task.taskId}
                      checked={task.checked}
                      onToggle={handleToggle}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Summary */}
      {groupDone === groupTotal && groupTotal > 0 && (
        <Card className="bg-success/30 border-success/30 mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-success-foreground font-medium">
              今日团体事项已完成
            </p>
          </CardContent>
        </Card>
      )}

      <BottomNav />
    </>
  );
}
