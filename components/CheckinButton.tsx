"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="ghost"
      size="icon"
      className={`rounded-full ${
        checked
          ? "bg-success-foreground text-white hover:bg-success-foreground/90"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : checked ? (
        <Check />
      ) : null}
    </Button>
  );
}
