"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { UserListFilters } from "@/components/admin/UserListFilters";

type Department = { id: string; name: string };
type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  department: { id: string; name: string };
  team: { id: string; name: string } | null;
};

type Props = {
  users: User[];
  departments: Department[];
};

function roleBadge(role: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: "bg-facamYellow", text: "text-facamDark", label: "Administrateur" },
    MANAGER: { bg: "bg-facamBlueTint", text: "text-facamBlue", label: "Manager" },
    COLLABORATOR: { bg: "bg-gray100", text: "text-gray600", label: "Collaborateur" },
  };
  const style = map[role] ?? map.COLLABORATOR;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function activeBadge(isActive: boolean) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-successLight text-success"
          : "bg-errorLight text-error"
      }`}
    >
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}

export function UserList({ users, departments }: Props) {
  const [filterDeptId, setFilterDeptId] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");

  const filtered = users.filter((u) => {
    if (filterDeptId && u.department.id !== filterDeptId) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterActive === "active" && !u.isActive) return false;
    if (filterActive === "inactive" && u.isActive) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <UserListFilters
        departments={departments}
        filterDeptId={filterDeptId}
        filterRole={filterRole}
        filterActive={filterActive}
        onDeptChange={setFilterDeptId}
        onRoleChange={setFilterRole}
        onActiveChange={setFilterActive}
      />

      <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray400">
            Aucun utilisateur ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray200">
                {["Nom", "Email", "Rôle", "Département", "Statut", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray200 last:border-0 hover:bg-gray50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
                        {user.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-facamDark">
                        {user.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray600">{user.email}</td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="px-4 py-3 text-sm text-gray600">
                    {user.department.name}
                    {user.team && (
                      <span className="block text-xs text-gray400">{user.team.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{activeBadge(user.isActive)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray500 hover:bg-gray100 hover:text-facamBlue"
                    >
                      <Pencil size={12} /> Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray400">
        {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""} affiché
        {filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
