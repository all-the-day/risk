"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "总览" },
  { href: "/admin/tasks", label: "事项" },
  { href: "/admin/groups", label: "团体" },
  { href: "/admin/users", label: "用户" },
  { href: "/admin/checkins", label: "打卡" },
  { href: "/admin/feedback", label: "反馈" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  const sidebarContent = (
    <>
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
              onClick={() => setMobileOpen(false)}
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
      <div className="mt-8 pt-4 border-t border-gray-700 space-y-1">
        <Link
          href="/today"
          onClick={() => setMobileOpen(false)}
          className="block px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800"
        >
          返回前台
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left px-3 py-2 rounded text-sm text-red-400 hover:bg-gray-800"
        >
          退出登录
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white px-4 py-3 flex items-center justify-between z-50">
        <h1 className="text-lg font-bold">管理后台</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed top-14 left-0 right-0 bg-gray-900 text-white p-4 z-40 transform transition-transform ${
          mobileOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-48 bg-gray-900 text-white min-h-screen p-4">
        {sidebarContent}
      </aside>
    </>
  );
}
