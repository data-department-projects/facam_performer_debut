import type {
  AdminProjectRow,
  ManagerTeamRow,
  CollaboratorKeyResultRow,
  DashboardData,
} from "./types";

const weekStatusLabel: Record<string, string> = {
  VALIDATED: "Validée",
  SUBMITTED: "Soumise",
  DRAFT: "En cours",
  NONE: "Non démarrée",
};

const weekStatusColor: Record<string, string> = {
  VALIDATED: "bg-successLight text-success",
  SUBMITTED: "bg-facamBlueTint text-facamBlue",
  DRAFT: "bg-[#fef9ec] text-[#92600a]",
  NONE: "bg-gray100 text-gray500",
};

const krStatusLabel: Record<string, string> = {
  NOT_STARTED: "Non démarré",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const krStatusColor: Record<string, string> = {
  NOT_STARTED: "bg-gray100 text-gray500",
  IN_PROGRESS: "bg-[#fef9ec] text-[#92600a]",
  DONE: "bg-successLight text-success",
};

function fmtFcfa(value: number): string {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function AdminTable({ rows }: Readonly<{ rows: AdminProjectRow[] }>) {
  return (
    <div>
      <p className="mb-4 text-base font-semibold text-facamDark">
        Projets actifs
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray400">Aucun projet actif pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray200">
                {["Projet", "Responsable", "Coût prévu", "Coût actuel", "Avancement"].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray500 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray200 hover:bg-gray50">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-gray400">{row.code}</span>
                    <p className="font-medium text-facamBlack">{row.name}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray600">{row.managerName}</td>
                  <td className="py-3 pr-4 text-gray600">{fmtFcfa(row.initialBudget)}</td>
                  <td className="py-3 pr-4">
                    <span className="text-gray600">{fmtFcfa(row.totalExpenses)}</span>
                    <span
                      className={`ml-1.5 text-xs font-semibold ${
                        row.budgetConsumedPercent > 100
                          ? "text-error"
                          : row.budgetConsumedPercent >= 80
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      ({row.budgetConsumedPercent}%)
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray200">
                        <div
                          className="h-full rounded-full bg-facamBlue"
                          style={{ width: `${row.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray600">{row.progressPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ManagerTable({ rows }: { rows: ManagerTeamRow[] }) {
  return (
    <div>
      <p className="mb-4 text-base font-semibold text-facamDark">
        État de mon équipe — semaine en cours
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray400">Aucun collaborateur dans votre équipe.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray200">
                {["Collaborateur", "Statut semaine", "Planifiées", "Terminées", "% Exécution"].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray500 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rate = row.totalTasks > 0
                  ? Math.round((row.doneTasks / row.totalTasks) * 100)
                  : 0;
                return (
                  <tr key={row.id} className="border-b border-gray200 hover:bg-gray50">
                    <td className="py-3 pr-4 font-medium text-facamBlack">{row.collaboratorName}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${weekStatusColor[row.weekStatus]}`}>
                        {weekStatusLabel[row.weekStatus]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray600">{row.totalTasks || "—"}</td>
                    <td className="py-3 pr-4 text-center text-gray600">{row.totalTasks > 0 ? row.doneTasks : "—"}</td>
                    <td className="py-3">
                      {row.totalTasks > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray200">
                            <div
                              className="h-full rounded-full bg-facamBlue"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray600">{rate}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CollaboratorTable({ rows }: { rows: CollaboratorKeyResultRow[] }) {
  return (
    <div>
      <p className="mb-4 text-base font-semibold text-facamDark">
        Mes résultats clés en cours
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray400">Aucun résultat clé en cours.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray200">
                {["Objectif", "Résultat clé", "Cible", "Atteint", "Statut", "Échéance"].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-gray500 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray200 hover:bg-gray50">
                  <td className="py-3 pr-4 text-xs font-medium text-gray600">{row.objectiveName}</td>
                  <td className="py-3 pr-4 font-medium text-facamBlack">{row.description}</td>
                  <td className="py-3 pr-4 text-center text-gray600">
                    {row.targetValue !== null ? row.targetValue : "—"}
                  </td>
                  <td className="py-3 pr-4 text-center text-gray600">
                    {row.currentValue !== null ? row.currentValue : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${krStatusColor[row.status]}`}>
                      {krStatusLabel[row.status]}
                    </span>
                  </td>
                  <td className="py-3 text-gray500">{row.dueDate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DashboardTable({
  role,
  data,
}: {
  role: string;
  data: DashboardData;
}) {
  return (
    <div className="rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm">
      {role === "ADMIN" ? (
        <AdminTable rows={data.tableRows as AdminProjectRow[]} />
      ) : role === "MANAGER" ? (
        <ManagerTable rows={data.tableRows as ManagerTeamRow[]} />
      ) : (
        <CollaboratorTable rows={data.tableRows as CollaboratorKeyResultRow[]} />
      )}
    </div>
  );
}
