"use client";

type Department = { id: string; name: string };

type Props = {
  departments: Department[];
  filterDeptId: string;
  filterRole: string;
  filterActive: "all" | "active" | "inactive";
  onDeptChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onActiveChange: (value: "all" | "active" | "inactive") => void;
};

const selectClass =
  "rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20";

export function UserListFilters({
  departments,
  filterDeptId,
  filterRole,
  filterActive,
  onDeptChange,
  onRoleChange,
  onActiveChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filterDeptId}
        onChange={(e) => onDeptChange(e.target.value)}
        className={selectClass}
        aria-label="Filtrer par département"
      >
        <option value="">Tous les départements</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={filterRole}
        onChange={(e) => onRoleChange(e.target.value)}
        className={selectClass}
        aria-label="Filtrer par rôle"
      >
        <option value="">Tous les rôles</option>
        <option value="ADMIN">Administrateur</option>
        <option value="MANAGER">Manager</option>
        <option value="COLLABORATOR">Collaborateur</option>
      </select>

      <div className="flex rounded-md border border-gray300 overflow-hidden text-sm">
        {(["all", "active", "inactive"] as const).map((v) => {
          const labels = { all: "Tous", active: "Actifs", inactive: "Inactifs" };
          return (
            <button
              key={v}
              onClick={() => onActiveChange(v)}
              className={[
                "px-3 py-2 font-medium transition-colors",
                filterActive === v
                  ? "bg-facamBlue text-facamWhite"
                  : "bg-facamWhite text-gray600 hover:bg-gray50",
              ].join(" ")}
            >
              {labels[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
