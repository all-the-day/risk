import { redirect } from "next/navigation";
import { requireAdmin } from "@/db/user";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0">{children}</main>
    </div>
  );
}
