"use client";

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
  groupName: string;
}

export default function GroupClient({
  taskStatus,
  allDone,
}: GroupClientProps) {
  return (
    <>
      {/* Status banner */}
      {allDone ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-green-700 font-medium">今日全员完成</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-yellow-700 font-medium">今日进行中</p>
        </div>
      )}

      {/* Task progress */}
      <div className="space-y-4">
        {taskStatus.map((task) => {
          const percentage =
            task.totalMembers > 0
              ? Math.round((task.completedCount / task.totalMembers) * 100)
              : 0;

          return (
            <div
              key={task.taskId}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">
                  {task.taskTitle}
                </h3>
                <span
                  className={`text-sm font-medium ${
                    task.allDone ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {task.completedCount}/{task.totalMembers}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    task.allDone ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Status text */}
              <p className="text-xs text-gray-400 mt-2">
                {task.allDone
                  ? "已完成"
                  : `还差 ${task.totalMembers - task.completedCount} 人`}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
