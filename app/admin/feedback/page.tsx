import { prisma } from "@/lib/prisma";
import FeedbackClient from "./FeedbackClient";

export default async function AdminFeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      user: { select: { phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">反馈管理</h1>
      <FeedbackClient initialFeedbacks={feedbacks} />
    </div>
  );
}
