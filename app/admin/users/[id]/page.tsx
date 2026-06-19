import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/admin/UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, departments] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
        teamId: true,
      },
    }),
    prisma.department.findMany({
      include: {
        subDepartments: {
          include: {
            teams: { select: { id: true, name: true, subDepartmentId: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-facamDark">{user.fullName}</h2>
        <p className="mt-1 text-sm text-gray500">
          Modifier les informations du compte utilisateur.
        </p>
      </div>

      <UserForm mode="edit" user={user} departments={departments} />
    </div>
  );
}
