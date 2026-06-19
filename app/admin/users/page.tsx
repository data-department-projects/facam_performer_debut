import { prisma } from "@/lib/prisma";
import { UserList } from "@/components/admin/UserList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-facamDark">Utilisateurs</h2>
          <p className="mt-1 text-sm text-gray500">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
        >
          + Nouvel utilisateur
        </Link>
      </div>

      <UserList users={users} departments={departments} />
    </div>
  );
}
