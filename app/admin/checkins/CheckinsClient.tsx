"use client";

import { useState } from "react";

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

  async function loadDate(newDate: string) {
    setLoading(true);
    setDate(newDate);

    const res = await fetch(`/api/admin/checkins?date=${newDate}`);
    if (res.ok) {
      const data = await res.json();
      setCheckins(data);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => loadDate(e.target.value)}
          className="px-3 py-2 border rounded"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  事项
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  打卡时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkins.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    当日无打卡记录
                  </td>
                </tr>
              ) : (
                checkins.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{c.user.phone}</td>
                    <td className="px-4 py-3 text-sm">{c.task.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          c.task.type === "group"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.task.type === "group" ? "团体" : "个人"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
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
