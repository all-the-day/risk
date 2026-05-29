import { redirect } from "next/navigation";
import { requireUser } from "@/db/user";
import ProfileClient from "./ProfileClient";
import BottomNav from "@/components/BottomNav";

export default async function ProfilePage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const membership = user.memberships[0];

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold">我的</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <ProfileClient
          nickname={membership.nickname}
          groupName={membership.group.name}
          inviteCode={membership.group.inviteCode}
        />
      </main>

      <BottomNav />
    </div>
  );
}
