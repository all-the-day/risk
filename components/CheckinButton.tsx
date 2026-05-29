"use client";

import { useState } from "react";

interface CheckinButtonProps {
  taskId: string;
  checked: boolean;
  onToggle: (taskId: string, checked: boolean) => void;
}

export default function CheckinButton({
  taskId,
  checked,
  onToggle,
}: CheckinButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      if (res.ok) {
        const data = await res.json();
        onToggle(taskId, data.checked);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        checked
          ? "bg-green-500 text-white"
          : "bg-gray-200 text-gray-400 hover:bg-gray-300"
      } ${loading ? "opacity-50" : ""}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : checked ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : null}
    </button>
  );
}
