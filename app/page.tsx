import { redirect } from "next/navigation";
import { getCurrentUser } from "@/db/user";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(user.isAdmin ? "/admin" : "/today");
}
