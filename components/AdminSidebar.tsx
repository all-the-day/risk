"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "总览" },
  { href: "/admin/tasks", label: "事项" },
  { href: "/admin/groups", label: "团体" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/checkins", label: "打卡" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">管理后台</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-4 border-t border-gray-700">
        <Link
          href="/today"
          className="block px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800"
        >
          返回前台
        </Link>
      </div>
    </aside>
  );
}
