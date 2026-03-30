import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChatClient } from "./ChatClient";

export default async function ChatPage() {
  // Get session and verify authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Verify admin role
  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return <ChatClient />;
}
