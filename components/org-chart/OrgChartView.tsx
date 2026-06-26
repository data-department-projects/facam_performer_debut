"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Mail,
  Building2,
  Users,
  Shield,
  ChevronRight,
  Layers,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type OrgUser = { id: string; fullName: string; email: string; role: string };

type TeamInfo = {
  id: string;
  name: string;
  manager: { id: string } | null;
  members: OrgUser[];
};

type SubDeptInfo = {
  id: string;
  name: string;
  teams: TeamInfo[];
};

type OrgDept = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  parentName: string | null;
  users: OrgUser[];
  subDepartments: SubDeptInfo[];
};

type ManagedGroup = {
  teamName: string;
  subDeptName: string;
  members: OrgUser[];
};

type PersonContext = {
  person: OrgUser;
  deptFullPath: string;
  managedGroups: ManagedGroup[];
  teamName: string | null;
};

type Props = { departments: OrgDept[] };

// ── Constantes ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

const AVATAR_BG: Record<string, { bg: string; fg: string }> = {
  ADMIN: { bg: "#001b61", fg: "#ffffff" },
  MANAGER: { bg: "#ffae03", fg: "#1c1c1e" },
  COLLABORATOR: { bg: "#bfdbfe", fg: "#1e3a5f" },
  INTERN: { bg: "#e5e7eb", fg: "#6b7280" },
};

const BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-facamBlue text-facamWhite",
  MANAGER: "bg-facamYellow text-facamDark",
  COLLABORATOR: "bg-gray100 text-gray600",
  INTERN: "bg-gray100 text-gray500",
};

const SORT_ORDER: Record<string, number> = {
  ADMIN: 0,
  MANAGER: 1,
  COLLABORATOR: 2,
  INTERN: 3,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function sortDeptsByHierarchy(depts: OrgDept[]): OrgDept[] {
  const roots = depts.filter((d) => !d.parentDepartmentId);
  const childrenOf = new Map<string, OrgDept[]>();
  for (const d of depts) {
    if (d.parentDepartmentId) {
      const arr = childrenOf.get(d.parentDepartmentId) ?? [];
      childrenOf.set(d.parentDepartmentId, [...arr, d]);
    }
  }
  const result: OrgDept[] = [];
  function push(dept: OrgDept) {
    result.push(dept);
    const kids = (childrenOf.get(dept.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
    kids.forEach(push);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach(push);
  return result;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const s = AVATAR_BG[role] ?? AVATAR_BG.COLLABORATOR;
  const cls = {
    xs: "h-7 w-7 text-[9px]",
    sm: "h-9 w-9 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-20 w-20 text-xl",
  }[size];
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-facamWhite`}
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── PersonCard ──────────────────────────────────────────────────────────────────

function PersonCard({
  person,
  isManager,
  teamName,
  onClick,
}: {
  person: OrgUser;
  isManager: boolean;
  teamName: string | null;
  onClick: () => void;
}) {
  const isAdmin = person.role === "ADMIN";

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col items-center gap-4 rounded-2xl border px-3 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-facamBlue ${
        isAdmin
          ? "border-facamBlue/30 bg-facamBlueTint hover:border-facamBlue/50"
          : isManager
            ? "border-facamYellow/30 bg-facamWhite hover:border-facamYellow/60"
            : "border-gray200 bg-facamWhite hover:border-gray300"
      }`}
    >
      {/* Badge manager / admin */}
      {(isManager || isAdmin) && (
        <span
          className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
            isAdmin
              ? "bg-facamBlue text-facamWhite"
              : "bg-facamYellow text-facamDark"
          }`}
        >
          <Shield size={7} />
          {isAdmin ? "DG" : "Resp."}
        </span>
      )}

      {/* Avatar */}
      <div className="relative">
        <Avatar name={person.fullName} role={person.role} size="lg" />
        {/* Anneau de rôle autour de l'avatar pour admin/manager */}
        {(isAdmin || isManager) && (
          <div
            className={`absolute inset-0 rounded-full ring-2 ring-offset-2 ${
              isAdmin ? "ring-facamBlue/40" : "ring-facamYellow/60"
            }`}
          />
        )}
      </div>

      {/* Nom + rôle */}
      <div className="w-full min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-facamDark">
          {person.fullName}
        </p>
        <span
          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
            BADGE_CLASS[person.role] ?? BADGE_CLASS.COLLABORATOR
          }`}
        >
          {ROLE_LABELS[person.role] ?? person.role}
        </span>
        {teamName && (
          <p className="mt-1.5 truncate text-[10px] text-gray400">{teamName}</p>
        )}
      </div>
    </button>
  );
}

// ── PersonDetailPanel ──────────────────────────────────────────────────────────

function PersonDetailPanel({
  ctx,
  onClose,
}: {
  ctx: PersonContext | null;
  onClose: () => void;
}) {
  const open = ctx !== null;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-facamDark/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-facamWhite shadow-2xl transition-transform duration-300 ease-in-out sm:w-80 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {ctx && (
          <>
            {/* Header du panneau */}
            <div className="flex items-center justify-between border-b border-gray100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray400">
                Fiche collaborateur
              </p>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-2 text-gray400 transition-colors hover:bg-gray100 hover:text-facamDark"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Hero : avatar + nom + rôle */}
              <div
                className={`flex flex-col items-center gap-3 px-5 py-8 text-center ${
                  ctx.person.role === "ADMIN"
                    ? "bg-facamBlueTint"
                    : ctx.person.role === "MANAGER"
                      ? "bg-warningLight"
                      : "bg-gray50"
                }`}
              >
                <div className="relative">
                  <Avatar name={ctx.person.fullName} role={ctx.person.role} size="xl" />
                  {ctx.managedGroups.length > 0 && (
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-facamYellow ring-2 ring-facamWhite">
                      <Shield size={13} className="text-facamDark" />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-facamDark">{ctx.person.fullName}</h3>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                      BADGE_CLASS[ctx.person.role] ?? BADGE_CLASS.COLLABORATOR
                    }`}
                  >
                    {ROLE_LABELS[ctx.person.role] ?? ctx.person.role}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 px-5 py-5">
                {/* Infos de contact */}
                <div className="flex flex-col gap-3 rounded-xl border border-gray100 bg-gray50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="mt-0.5 shrink-0 text-gray400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
                        Email
                      </p>
                      <p className="break-all text-sm text-facamDark">{ctx.person.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 size={14} className="mt-0.5 shrink-0 text-gray400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
                        Département
                      </p>
                      <p className="text-sm font-medium text-facamDark">{ctx.deptFullPath}</p>
                    </div>
                  </div>

                  {ctx.teamName && (
                    <div className="flex items-start gap-3">
                      <Users size={14} className="mt-0.5 shrink-0 text-gray400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
                          Équipe
                        </p>
                        <p className="text-sm font-medium text-facamDark">{ctx.teamName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Groupes gérés (Manager) */}
                {ctx.managedGroups.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-facamBlue" />
                      <p className="text-xs font-bold uppercase tracking-widest text-facamBlue">
                        Équipes encadrées
                      </p>
                    </div>
                    {ctx.managedGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className="overflow-hidden rounded-xl border border-facamBlue/15 bg-facamBlueTint/40"
                      >
                        <div className="flex items-center justify-between border-b border-facamBlue/10 px-4 py-2.5">
                          <p className="text-xs font-semibold text-facamDark">
                            {group.teamName}
                          </p>
                          <span className="rounded-full bg-facamBlue/10 px-2 py-0.5 text-[10px] font-medium text-facamBlue">
                            {group.members.length} pers.
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 p-3">
                          {group.members.map((m) => (
                            <div key={m.id} className="flex items-center gap-2.5">
                              <Avatar name={m.fullName} role={m.role} size="xs" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-facamDark">
                                  {m.fullName}
                                </p>
                                <p className="text-[10px] text-gray400">
                                  {ROLE_LABELS[m.role] ?? m.role}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ── Section département ────────────────────────────────────────────────────────

function DeptSection({
  dept,
  managerIds,
  teamOfPerson,
  onPersonClick,
}: {
  dept: OrgDept;
  managerIds: Set<string>;
  teamOfPerson: Map<string, string>;
  onPersonClick: (person: OrgUser, dept: OrgDept) => void;
}) {
  const sorted = [...dept.users].sort(
    (a, b) =>
      (SORT_ORDER[a.role] ?? 99) - (SORT_ORDER[b.role] ?? 99) ||
      a.fullName.localeCompare(b.fullName, "fr"),
  );

  const isChild = !!dept.parentDepartmentId;
  const totalTeamMembers = dept.subDepartments.flatMap((sd) =>
    sd.teams.flatMap((t) => t.members),
  ).length;

  return (
    <section className={isChild ? "ml-6 border-l-2 border-facamBlue/15 pl-5" : ""}>
      {/* En-tête de département */}
      <div
        className={`mb-5 overflow-hidden rounded-2xl border bg-facamWhite shadow-sm ${
          isChild ? "border-facamBlue/20" : "border-gray200"
        }`}
      >
        {/* Barre accent */}
        <div className={`h-1 w-full ${isChild ? "bg-facamBlueMid" : "bg-facamBlue"}`} />

        <div className="flex items-center gap-4 px-5 py-4">
          {/* Icône */}
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl ${
              isChild ? "h-10 w-10 bg-facamBlueTint" : "h-12 w-12 bg-facamBlue shadow-md"
            }`}
          >
            <Building2
              size={isChild ? 17 : 20}
              className={isChild ? "text-facamBlueMid" : "text-facamWhite"}
            />
          </div>

          {/* Nom + breadcrumb */}
          <div className="flex-1 min-w-0">
            {dept.parentName && (
              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-gray400">
                <span>{dept.parentName}</span>
                <ChevronRight size={9} />
              </div>
            )}
            <h2
              className={`truncate font-bold text-facamDark ${isChild ? "text-base" : "text-lg"}`}
            >
              {dept.name}
            </h2>
          </div>

          {/* Stats */}
          <div className="flex shrink-0 items-center gap-3">
            {sorted.length > 0 && (
              <div className="flex flex-col items-center rounded-xl border border-gray200 px-3 py-2">
                <span className="text-lg font-bold text-facamDark">{sorted.length}</span>
                <span className="text-[10px] text-gray400">
                  {sorted.length > 1 ? "personnes" : "personne"}
                </span>
              </div>
            )}
            {dept.subDepartments.length > 0 && (
              <div className="hidden flex-col items-center rounded-xl border border-gray200 px-3 py-2 sm:flex">
                <span className="text-lg font-bold text-facamDark">
                  {dept.subDepartments.length}
                </span>
                <span className="text-[10px] text-gray400">sous-dép.</span>
              </div>
            )}
            {totalTeamMembers > 0 && (
              <div className="hidden flex-col items-center rounded-xl border border-gray200 px-3 py-2 md:flex">
                <span className="text-lg font-bold text-facamDark">{totalTeamMembers}</span>
                <span className="text-[10px] text-gray400">en équipes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille des personnes */}
      {sorted.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sorted.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              isManager={managerIds.has(person.id)}
              teamName={teamOfPerson.get(person.id) ?? null}
              onClick={() => onPersonClick(person, dept)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-gray200 px-4 py-5 text-sm text-gray400">
          <Users size={14} className="shrink-0 text-gray300" />
          Aucune personne rattachée directement à ce département.
        </div>
      )}

      {/* Sous-départements : grilles groupées par équipe */}
      {dept.subDepartments.length > 0 && (
        <div className="mb-6 flex flex-col gap-6">
          {dept.subDepartments.map((sd) => {
            const allMembers = sd.teams.flatMap((t) => t.members);
            if (allMembers.length === 0) return null;
            return (
              <div key={sd.id}>
                {/* En-tête sous-département */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warningLight">
                    <Layers size={11} className="text-warning" />
                  </div>
                  <p className="text-xs font-semibold text-facamDark">{sd.name}</p>
                  <div className="flex-1 border-t border-gray200" />
                  <span className="shrink-0 rounded-full bg-gray100 px-2 py-0.5 text-[10px] text-gray500">
                    {allMembers.length} membre{allMembers.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {/* Équipes */}
                <div className="flex flex-col gap-4 pl-4 border-l-2 border-facamYellow/20">
                  {sd.teams.map((team) => {
                    if (team.members.length === 0) return null;
                    const sortedMembers = [...team.members].sort(
                      (a, b) =>
                        (SORT_ORDER[a.role] ?? 99) - (SORT_ORDER[b.role] ?? 99) ||
                        a.fullName.localeCompare(b.fullName, "fr"),
                    );
                    return (
                      <div key={team.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray100">
                            <Users size={10} className="text-gray500" />
                          </div>
                          <p className="text-[11px] font-semibold text-gray600">{team.name}</p>
                          <div className="flex-1 border-t border-dashed border-gray200" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                          {sortedMembers.map((person) => (
                            <PersonCard
                              key={person.id}
                              person={person}
                              isManager={managerIds.has(person.id)}
                              teamName={team.name}
                              onClick={() => onPersonClick(person, dept)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── OrgChartView ───────────────────────────────────────────────────────────────

export function OrgChartView({ departments }: Props) {
  const [selectedCtx, setSelectedCtx] = useState<PersonContext | null>(null);

  const sortedDepts = useMemo(() => sortDeptsByHierarchy(departments), [departments]);

  const { managedGroupsMap, managerIds, teamOfPerson } = useMemo(() => {
    const groupMap = new Map<string, ManagedGroup[]>();
    const ids = new Set<string>();
    const personTeam = new Map<string, string>();

    for (const dept of departments) {
      for (const subDept of dept.subDepartments) {
        for (const team of subDept.teams) {
          // Enregistrer l'équipe de chaque membre
          for (const m of team.members) {
            personTeam.set(m.id, team.name);
          }
          // Enregistrer les groupes gérés par le manager
          if (!team.manager) continue;
          ids.add(team.manager.id);
          const existing = groupMap.get(team.manager.id) ?? [];
          groupMap.set(team.manager.id, [
            ...existing,
            {
              teamName: team.name,
              subDeptName: subDept.name,
              members: team.members.filter((m) => m.id !== team.manager!.id),
            },
          ]);
        }
      }
    }
    return { managedGroupsMap: groupMap, managerIds: ids, teamOfPerson: personTeam };
  }, [departments]);

  const handlePersonClick = useCallback(
    (person: OrgUser, dept: OrgDept) => {
      const fullPath = dept.parentName ? `${dept.parentName} › ${dept.name}` : dept.name;
      setSelectedCtx({
        person,
        deptFullPath: fullPath,
        managedGroups: managedGroupsMap.get(person.id) ?? [],
        teamName: teamOfPerson.get(person.id) ?? null,
      });
    },
    [managedGroupsMap, teamOfPerson],
  );

  const handleClose = useCallback(() => setSelectedCtx(null), []);

  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
        <Building2 size={32} className="mb-3 text-gray300" />
        <p className="text-sm text-gray500">Aucun département disponible.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {sortedDepts.map((dept) => {
          const allUsers = [
            ...dept.users,
            ...dept.subDepartments.flatMap((sd) => sd.teams.flatMap((t) => t.members)),
          ];
          if (allUsers.length === 0) return null;

          return (
            <DeptSection
              key={dept.id}
              dept={dept}
              managerIds={managerIds}
              teamOfPerson={teamOfPerson}
              onPersonClick={handlePersonClick}
            />
          );
        })}
      </div>
      <PersonDetailPanel ctx={selectedCtx} onClose={handleClose} />
    </>
  );
}
