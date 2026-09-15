"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/admin/scores", label: "周分录入" },
  { href: "/admin/activities", label: "事项模板" },
  { href: "/admin/groups", label: "团体" },
  { href: "/admin/users", label: "用户" },
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
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/today"
          onClick={() => setMobileOpen(false)}
          className="block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          返回前台
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          退出登录
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-4 py-3 flex items-center justify-between z-50">
        <h1 className="text-lg font-bold">管理后台</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed top-14 left-0 right-0 bg-sidebar text-sidebar-foreground border-b border-sidebar-border p-4 z-40 transform transition-transform ${
          mobileOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-48 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen p-4">
        {sidebarContent}
      </aside>
    </>
  );
}
