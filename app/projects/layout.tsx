import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
};

export default async function ProjectsLayout({ children }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Collaborateur → sa vue est en feature 16 (/projects côté collab n'existe pas encore)
  if (session.user.role === "COLLABORATOR") redirect("/dashboard");

  return <>{children}</>;
}
