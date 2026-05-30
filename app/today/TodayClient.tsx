"use client";

import { useState } from "react";
import CheckinButton from "@/components/CheckinButton";
import BottomNav from "@/components/BottomNav";

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

  return (
    <>
      {/* Group tasks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">团体事项</h2>
          <span className="text-sm text-gray-500">
            {groupDone}/{groupTasks.length}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {groupTasks.map((task) => (
            <div
              key={task.taskId}
              className="flex items-center justify-between px-4 py-3"
            >
              <span
                className={`${
                  task.checked ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {task.taskTitle}
              </span>
              <CheckinButton
                taskId={task.taskId}
                checked={task.checked}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Personal tasks */}
      {personalTasks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">个人事项</h2>
            <span className="text-sm text-gray-500">
              {personalDone}/{personalTasks.length}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {personalTasks.map((task) => (
              <div
                key={task.taskId}
                className="flex items-center justify-between px-4 py-3"
              >
                <span
                  className={`${
                    task.checked
                      ? "text-gray-400 line-through"
                      : "text-gray-700"
                  }`}
                >
                  {task.taskTitle}
                </span>
                <CheckinButton
                  taskId={task.taskId}
                  checked={task.checked}
                  onToggle={handleToggle}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {groupDone === groupTasks.length && groupTasks.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-medium">今日团体事项已完成</p>
        </div>
      )}

      <BottomNav />
    </>
  );
}
