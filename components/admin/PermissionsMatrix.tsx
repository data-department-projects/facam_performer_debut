"use client";

const MODULES = [
  { key: "gantt", label: "Gantt / Tâches assignées" },
  { key: "projects", label: "Projets" },
  { key: "objectives", label: "Objectifs individuels" },
  { key: "dept_objectives", label: "Objectifs Départements" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

type PermissionLevel = "full" | "conditional" | "read" | "none";

type MatrixRow = {
  module: ModuleKey;
  admin: PermissionLevel;
  manager: PermissionLevel;
  collaborator: PermissionLevel;
};

const MATRIX: MatrixRow[] = [
  { module: "gantt", admin: "full", manager: "conditional", collaborator: "read" },
  { module: "projects", admin: "full", manager: "conditional", collaborator: "read" },
  { module: "objectives", admin: "full", manager: "conditional", collaborator: "full" },
  { module: "dept_objectives", admin: "full", manager: "conditional", collaborator: "none" },
];

type PermConfig = Record<ModuleKey, { manager: boolean; collaborator: boolean }>;

const DEFAULT_CONFIG: PermConfig = {
  gantt: { manager: true, collaborator: false },
  projects: { manager: true, collaborator: false },
  objectives: { manager: true, collaborator: false },
  dept_objectives: { manager: false, collaborator: false },
};

function PermCell({
  level,
  enabled,
  onToggle,
}: {
  level: PermissionLevel;
  enabled?: boolean;
  onToggle?: () => void;
}) {
  if (level === "full") {
    return (
      <td className="px-4 py-3 text-center">
        <span className="rounded-full bg-successLight px-2 py-0.5 text-xs font-medium text-success">
          Complet
        </span>
      </td>
    );
  }
  if (level === "none") {
    return (
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-gray400">—</span>
      </td>
    );
  }
  if (level === "read") {
    return (
      <td className="px-4 py-3 text-center">
        <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-xs font-medium text-facamBlue">
          Lecture
        </span>
      </td>
    );
  }
  // conditional — toggleable
  return (
    <td className="px-4 py-3 text-center">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <div
          onClick={onToggle}
          className={[
            "relative h-5 w-9 rounded-full transition-colors",
            enabled ? "bg-facamBlue" : "bg-gray300",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-4 w-4 rounded-full bg-facamWhite shadow transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </div>
        <span className="text-xs text-gray500">{enabled ? "Activé" : "Désactivé"}</span>
      </label>
    </td>
  );
}

export function PermissionsMatrix() {
  // Les permissions "selon permissions" sont configurables par l'Admin
  // La persistance nécessite un modèle PermissionsConfig en base — en attente de migration
  const config = DEFAULT_CONFIG;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray200">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray500 w-48">
                Module
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray500 text-center">
                Administrateur
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray500 text-center">
                Manager
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray500 text-center">
                Collaborateur
              </th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => {
              const moduleDef = MODULES.find((m) => m.key === row.module)!;
              return (
                <tr key={row.module} className="border-b border-gray200 last:border-0 hover:bg-gray50">
                  <td className="px-4 py-3 text-sm font-medium text-facamDark">
                    {moduleDef.label}
                  </td>
                  <PermCell level={row.admin} />
                  <PermCell
                    level={row.manager}
                    enabled={config[row.module].manager}
                  />
                  <PermCell
                    level={row.collaborator}
                    enabled={
                      row.collaborator === "conditional"
                        ? config[row.module].collaborator
                        : undefined
                    }
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="rounded-lg border border-gray200 bg-facamBlueTint px-4 py-3 text-xs text-gray600">
        <strong>Note :</strong> Les toggles &quot;Selon permissions&quot; seront persistés
        après l&apos;ajout du modèle <code>PermissionsConfig</code> en base de données.
        La configuration actuelle est statique.
      </p>
    </div>
  );
}
