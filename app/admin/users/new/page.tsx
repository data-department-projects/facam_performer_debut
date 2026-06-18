import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/admin/UserForm";

export default async function NewUserPage() {
  const departments = await prisma.department.findMany({
    include: {
      subDepartments: {
        include: {
          teams: { select: { id: true, name: true, subDepartmentId: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-facamDark">Nouvel utilisateur</h2>
        <p className="mt-1 text-sm text-gray500">
          Créez un compte pour un collaborateur, manager ou administrateur.
        </p>
      </div>

      <UserForm mode="create" departments={departments} />
    </div>
  );
}
