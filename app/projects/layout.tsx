import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
};

export default async function ProjectsLayout({ children }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Tous les rôles peuvent accéder à /projects (chacun voit sa vue dédiée)

  return <>{children}</>;
}
