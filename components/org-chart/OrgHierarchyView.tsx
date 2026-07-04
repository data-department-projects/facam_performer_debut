"use client";

import { Shield, Users, UsersRound } from "lucide-react";
import { getDepartmentSwatch, type DepartmentColorValue } from "@/lib/department-colors";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HierarchyUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentName: string;
  color: DepartmentColorValue | null;
};

export type ManagerGroup = {
  manager: HierarchyUser;
  reports: HierarchyUser[];
};

type Props = {
  admins: HierarchyUser[];
  managerGroups: ManagerGroup[];
  unassigned: HierarchyUser[];
  legend: { name: string; color: DepartmentColorValue }[];
  totalHeadcount: number;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Carte personne ─────────────────────────────────────────────────────────────

function PersonCard({
  user,
  roleOverrideLabel,
  size = "md",
  headcount,
}: {
  user: HierarchyUser;
  roleOverrideLabel?: string;
  size?: "lg" | "md" | "sm";
  headcount?: number;
}) {
  const swatch = getDepartmentSwatch(user.color);
  const dims =
    size === "lg"
      ? { avatar: "h-14 w-14 text-base", pad: "p-4", width: "w-80", name: "text-sm" }
      : size === "md"
        ? { avatar: "h-11 w-11 text-sm", pad: "p-3.5", width: "w-72", name: "text-sm" }
        : { avatar: "h-9 w-9 text-xs", pad: "p-3", width: "w-64", name: "text-xs" };

  return (
    <div
      className={`flex ${dims.width} shrink-0 items-center gap-3 rounded-xl border-2 bg-facamWhite ${dims.pad} shadow-sm transition-shadow hover:shadow-md ${swatch.border}`}
    >
      <div
        className={`flex ${dims.avatar} shrink-0 items-center justify-center rounded-full font-bold text-facamWhite ${swatch.dot}`}
      >
        {initials(user.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold text-facamDark ${dims.name}`}>{user.fullName}</p>
        <p className="truncate text-[11px] text-gray500">
          {roleOverrideLabel ?? ROLE_LABELS[user.role] ?? user.role}
        </p>
        <p className={`truncate text-[10px] font-medium ${swatch.text}`}>{user.departmentName}</p>
      </div>
      {typeof headcount === "number" && (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray100 px-2 py-1 text-[11px] font-semibold text-gray500">
          <Users size={11} />
          {headcount}
        </div>
      )}
    </div>
  );
}

// ── Connecteurs ────────────────────────────────────────────────────────────────

function VerticalConnector({ height = "h-6" }: { height?: string }) {
  return <div className={`mx-auto ${height} w-px bg-gray300`} />;
}

/** Rangée d'éléments reliés à un même parent par une ligne horizontale (bus) + un drop vertical chacun. */
function ConnectedRow({ children }: { children: React.ReactNode[] }) {
  if (children.length === 0) return null;
  if (children.length === 1) {
    return (
      <div className="flex flex-col items-center">
        <VerticalConnector height="h-6" />
        {children[0]}
      </div>
    );
  }
  return (
    <div className="mx-auto inline-flex gap-6 border-t-2 border-gray300 pt-6">
      {children.map((child, i) => (
        <div key={i} className="relative flex flex-col items-center">
          <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-6 bg-gray300" />
          {child}
        </div>
      ))}
    </div>
  );
}

// ── Groupe Manager + ses collaborateurs ────────────────────────────────────────

function ManagerGroupBlock({ group }: { group: ManagerGroup }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <PersonCard user={group.manager} size="md" headcount={group.reports.length || undefined} />
      {group.reports.length > 0 && (
        <>
          <VerticalConnector height="h-5" />
          <ConnectedRow>
            {group.reports.map((r) => (
              <PersonCard key={r.id} user={r} size="sm" />
            ))}
          </ConnectedRow>
        </>
      )}
    </div>
  );
}

// ── Vue principale ──────────────────────────────────────────────────────────────

export function OrgHierarchyView({ admins, managerGroups, unassigned, legend, totalHeadcount }: Props) {
  const hasManagers = managerGroups.length > 0;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Arbre hiérarchique */}
      <div className="min-w-0 flex-1 overflow-x-auto pb-4">
        <div className="flex w-fit min-w-full flex-col items-center gap-0 px-2">
          {/* Tier 1 — Direction */}
          {admins.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray200 bg-facamWhite px-6 py-8 text-center">
              <Shield size={24} className="text-gray300" />
              <p className="text-xs text-gray400">Aucun administrateur actif.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {admins.map((a) => (
                <PersonCard
                  key={a.id}
                  user={a}
                  roleOverrideLabel="Directeur Général"
                  size="lg"
                  headcount={totalHeadcount}
                />
              ))}
            </div>
          )}

          {/* Tier 2 — Managers + Tier 3 — Collaborateurs (par groupe) */}
          {hasManagers && (
            <>
              <VerticalConnector height="h-7" />
              <div className="mx-auto inline-flex items-start gap-10 border-t-2 border-gray300 pt-7">
                {managerGroups.map((group) => (
                  <div key={group.manager.id} className="relative">
                    <div className="absolute left-1/2 top-0 h-7 w-px -translate-x-1/2 -translate-y-7 bg-gray300" />
                    <ManagerGroupBlock group={group} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Collaborateurs non rattachés à un manager */}
          {unassigned.length > 0 && (
            <div className="mt-10 flex w-full flex-col items-center gap-3 border-t border-dashed border-gray200 pt-6">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray400">
                <UsersRound size={13} />
                Non rattaché·e·s à un manager
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {unassigned.map((u) => (
                  <PersonCard key={u.id} user={u} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Légende des couleurs, à côté */}
      {legend.length > 0 && (
        <aside className="w-full shrink-0 lg:w-56">
          <div className="rounded-xl border border-gray200 bg-facamWhite p-4 shadow-sm lg:sticky lg:top-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray400">
              Légende des départements
            </p>
            <div className="flex flex-col gap-2.5">
              {legend.map((l) => {
                const swatch = getDepartmentSwatch(l.color);
                return (
                  <div key={l.name} className="flex items-center gap-2">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${swatch.dot}`} />
                    <span className="truncate text-xs font-medium text-facamDark">{l.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
