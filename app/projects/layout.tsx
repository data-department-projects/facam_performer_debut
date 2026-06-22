import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
};

export default async function ProjectsLayout({ children }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "COLLABORATOR" || session.user.role === "INTERN") redirect("/dashboard");

  return <>{children}</>;
}
