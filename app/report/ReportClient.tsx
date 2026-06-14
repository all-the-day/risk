"use client";

import BottomNav from "@/components/BottomNav";

interface ReportItem {
  id: string;
  name: string;
  maxScore: number;
  checksPerWeek: number;
  checkedDays: number;
  earned: number;
}

interface ReportClientProps {
  weekLabel: string;
  items: ReportItem[];
  totalScore: number;
  maxTotalScore: number;
}

export default function ReportClient({
  weekLabel,
  items,
  totalScore,
  maxTotalScore,
}: ReportClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">周报告</h1>
          <p className="text-sm text-gray-500 mt-1">{weekLabel}</p>
          <div className="mt-3 bg-white rounded-lg shadow p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600">{totalScore}</span>
              <span className="text-sm text-gray-500">/ {maxTotalScore} 分</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: maxTotalScore > 0 ? `${(totalScore / maxTotalScore) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow divide-y">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              暂无评分项目，请先在管理后台启用活动模板。
            </div>
          ) : (
            items.map((item) => {
              const isDaily = item.checksPerWeek > 1;
              return (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({isDaily ? `每天×${item.checksPerWeek}次` : "每周1次"})
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      已打卡 {item.checkedDays} / {item.checksPerWeek} 次
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {item.earned}
                    </span>
                    <span className="text-xs text-gray-400"> / {item.maxScore}分</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
