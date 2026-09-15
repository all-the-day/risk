"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, BarChart3, Users, User } from "lucide-react";

const navItems = [
  { href: "/today", label: "今日", icon: CalendarCheck },
  { href: "/report", label: "报告", icon: BarChart3 },
  { href: "/group", label: "团体", icon: Users },
  { href: "/profile", label: "我的", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
