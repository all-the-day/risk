import { prisma } from "@/lib/prisma";
import { getTodayString } from "@/lib/date";
import CheckinsClient from "./CheckinsClient";

export default async function AdminCheckinsPage() {
  const today = getTodayString();

  const checkins = await prisma.checkin.findMany({
    where: { date: today },
    include: {
      user: { select: { phone: true } },
      task: { select: { title: true, type: true } },
    },
    orderBy: { checkedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">打卡记录</h1>
      <CheckinsClient initialDate={today} initialCheckins={checkins} />
    </div>
  );
}
