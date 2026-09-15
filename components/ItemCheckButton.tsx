"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemCheckButtonProps {
  itemId: string;
  checked: boolean;
  onToggle: (itemId: string, checked: boolean) => void;
  onError: (message: string) => void;
}

export default function ItemCheckButton({
  itemId,
  checked,
  onToggle,
  onError,
}: ItemCheckButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();

      if (res.ok) {
        onToggle(itemId, data.checked);
      } else {
        onError(data.error || "打卡失败");
      }
    } catch {
      onError("网络错误，请重试");
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
      data-item-id={itemId}
      aria-label={checked ? "取消打卡" : "打卡"}
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
