import { prisma } from "@/lib/prisma";
import FeedbackClient, { type AdminFeedback } from "./FeedbackClient";

export default async function AdminFeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      user: { select: { nickname: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data: AdminFeedback[] = feedbacks.map((feedback) => ({
    id: feedback.id,
    type: feedback.type,
    content: feedback.content,
    status: feedback.status,
    nickname: feedback.user.nickname,
    createdAt: feedback.createdAt.toISOString().slice(0, 16).replace("T", " "),
  }));

  return <FeedbackClient feedbacks={data} />;
}
