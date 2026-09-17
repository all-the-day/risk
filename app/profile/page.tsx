import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import ProfileClient from "./ProfileClient";
import BottomNav from "@/components/BottomNav";

export default async function ProfilePage() {
  const user = await requireUser();

  if (user.memberships.length === 0) {
    redirect("/join");
  }

  const membership = user.memberships[0];

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-md mx-auto px-4 pt-8 pb-6">
        <ProfileClient
          nickname={membership.nickname}
          membershipId={membership.id}
          groupName={membership.group.name}
          groupId={membership.group.id}
          inviteCode={membership.group.inviteCode}
        />
      </main>

      <BottomNav />
    </div>
  );
}
