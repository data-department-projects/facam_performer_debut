import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name ?? "Utilisateur";
  const role = session?.user?.role;

  const roleLabel =
    role === "ADMIN"
      ? "Administrateur"
      : role === "MANAGER"
        ? "Manager"
        : "Collaborateur";

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête de bienvenue */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-facamDark">
          Bienvenue, {name} 
        </h2>
        <p className="mt-1 text-sm text-gray500">
          Vous êtes connecté en tant que{" "}
          <span className="font-medium text-facamBlue">{roleLabel}</span>.
        </p>
      </div>

      {/* Placeholder KPI — données mock (Phase 9) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tâches du jour", value: "—", color: "text-facamBlue" },
          { label: "Projets actifs", value: "—", color: "text-success" },
          { label: "Réunions à venir", value: "—", color: "text-warning" },
          { label: "Objectifs en cours", value: "—", color: "text-facamBlue" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray500">
              {kpi.label}
            </p>
            <p className={`mt-2 text-3xl font-semibold ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Note placeholder */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="text-sm text-gray500">
          Les données du tableau de bord seront disponibles après la Phase 9.
          Les modules sont accessibles via la barre de navigation.
        </p>
      </div>
    </div>
  );
}
