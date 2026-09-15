"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CheckinRecord {
  id: string;
  date: string;
  checkedAt: Date;
  user: { phone: string };
  task: { title: string; type: string };
}

export default function CheckinsClient({
  initialDate,
  initialCheckins,
}: {
  initialDate: string;
  initialCheckins: CheckinRecord[];
}) {
  const [date, setDate] = useState(initialDate);
  const [checkins, setCheckins] = useState(initialCheckins);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDate(newDate: string) {
    setLoading(true);
    setError(null);
    setDate(newDate);

    try {
      const res = await fetch(`/api/admin/checkins?date=${newDate}`);
      if (res.ok) {
        const data = await res.json();
        setCheckins(data);
      } else {
        const data = await res.json();
        setError(data.error || "查询失败");
        setCheckins([]);
      }
    } catch {
      setError("网络错误");
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Input
          type="date"
          value={date}
          onChange={(e) => loadDate(e.target.value)}
          className="w-44"
        />
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  事项
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  打卡时间
                </th>
              </tr>
            </thead>
            <tbody>
              {checkins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    当日无打卡记录
                  </td>
                </tr>
              ) : (
                checkins.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{c.user.phone}</td>
                    <td className="px-4 py-3 text-sm">{c.task.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        variant={c.task.type === "group" ? "default" : "secondary"}
                      >
                        {c.task.type === "group" ? "团体" : "个人"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(c.checkedAt).toLocaleTimeString("zh-CN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
