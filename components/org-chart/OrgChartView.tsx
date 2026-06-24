"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, Mail, Building2, Users, Shield } from "lucide-react";

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
  users: OrgUser[];
  subDepartments: SubDeptInfo[];
};

type ManagedGroup = {
  subDeptName: string;
  members: OrgUser[];
};

type PersonContext = {
  person: OrgUser;
  deptName: string;
  managedGroups: ManagedGroup[];
};

type Props = { departments: OrgDept[] };

// ── Constants (module scope — not recreated per render) ────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

const AVATAR_STYLE: Record<string, { bg: string; fg: string }> = {
  ADMIN:        { bg: "#003f7f", fg: "#ffffff" },
  MANAGER:      { bg: "#ffae03", fg: "#1c1c1e" },
  COLLABORATOR: { bg: "#bfdbfe", fg: "#1e3a5f" },
  INTERN:       { bg: "#e5e7eb", fg: "#6b7280" },
};

const BADGE_CLASS: Record<string, string> = {
  ADMIN:        "bg-facamBlue text-facamWhite",
  MANAGER:      "bg-facamYellow text-facamDark",
  COLLABORATOR: "bg-gray100 text-gray600",
  INTERN:       "bg-gray100 text-gray500",
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

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = AVATAR_STYLE[role] ?? AVATAR_STYLE.COLLABORATOR;
  const cls =
    size === "sm"
      ? "h-9 w-9 text-[11px]"
      : size === "lg"
        ? "h-20 w-20 text-2xl"
        : "h-12 w-12 text-sm";
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white`}
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── PersonCard ─────────────────────────────────────────────────────────────────

function PersonCard({
  person,
  isManager,
  onClick,
}: {
  person: OrgUser;
  isManager: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col items-center gap-3 rounded-2xl border px-3 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-facamBlue ${
        isManager
          ? "border-facamBlue/30 bg-gradient-to-b from-facamBlue/8 to-facamWhite hover:border-facamBlue/60"
          : "border-gray200 bg-facamWhite hover:border-gray300"
      }`}
    >
      {isManager && (
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-facamBlue/90 px-1.5 py-0.5 text-[9px] font-bold leading-none text-facamWhite">
          <Shield size={7} />
          Resp.
        </span>
      )}

      <Avatar name={person.fullName} role={person.role} size="md" />

      <div className="w-full min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-facamDark">
          {person.fullName}
        </p>
        <span
          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${BADGE_CLASS[person.role] ?? BADGE_CLASS.COLLABORATOR}`}
        >
          {ROLE_LABELS[person.role] ?? person.role}
        </span>
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

  // Escape key to close
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
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide panel — full-width on mobile, 320px on sm+ */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-facamWhite shadow-2xl transition-transform duration-300 ease-in-out sm:w-80 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {ctx && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-gray100 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray400">
                Fiche collaborateur
              </p>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-2.5 text-gray400 transition-colors hover:bg-gray100 hover:text-facamDark"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {/* Identity */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <Avatar name={ctx.person.fullName} role={ctx.person.role} size="lg" />
                  {ctx.managedGroups.length > 0 && (
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-facamBlue ring-2 ring-facamWhite">
                      <Shield size={11} className="text-facamWhite" />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-facamDark">
                    {ctx.person.fullName}
                  </h3>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${BADGE_CLASS[ctx.person.role] ?? BADGE_CLASS.COLLABORATOR}`}
                  >
                    {ROLE_LABELS[ctx.person.role] ?? ctx.person.role}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-gray100 bg-gray50 p-4">
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
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
                      Département
                    </p>
                    <p className="text-sm font-medium text-facamDark">{ctx.deptName}</p>
                  </div>
                </div>
              </div>

              {/* Managed groups (Manager only) */}
              {ctx.managedGroups.length > 0 && (
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-facamBlue" />
                    <p className="text-xs font-bold uppercase tracking-widest text-facamBlue">
                      Personnes rattachées
                    </p>
                  </div>

                  {ctx.managedGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl border border-facamBlue/15 bg-facamBlue/3"
                    >
                      <div className="flex items-center justify-between border-b border-facamBlue/10 px-4 py-2.5">
                        <p className="text-xs font-semibold text-facamDark">
                          {group.subDeptName}
                        </p>
                        <span className="rounded-full bg-facamBlue/10 px-2 py-0.5 text-[10px] font-medium text-facamBlue">
                          {group.members.length} pers.
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 p-3">
                        {group.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-2.5">
                            <Avatar name={m.fullName} role={m.role} size="sm" />
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
          </>
        )}
      </aside>
    </>
  );
}

// ── OrgChartView ───────────────────────────────────────────────────────────────

export function OrgChartView({ departments }: Props) {
  const [selectedCtx, setSelectedCtx] = useState<PersonContext | null>(null);

  // Memoized: only rebuild when `departments` reference changes
  const { managedGroupsMap, managerIds } = useMemo(() => {
    const map = new Map<string, ManagedGroup[]>();
    const ids = new Set<string>();

    for (const dept of departments) {
      for (const subDept of dept.subDepartments) {
        for (const team of subDept.teams) {
          if (!team.manager) continue;
          ids.add(team.manager.id);
          const existing = map.get(team.manager.id) ?? [];
          map.set(team.manager.id, [
            ...existing,
            {
              subDeptName: subDept.name,
              members: team.members.filter((m) => m.id !== team.manager!.id),
            },
          ]);
        }
      }
    }
    return { managedGroupsMap: map, managerIds: ids };
  }, [departments]);

  const handleClick = useCallback(
    (person: OrgUser, deptName: string) => {
      setSelectedCtx({
        person,
        deptName,
        managedGroups: managedGroupsMap.get(person.id) ?? [],
      });
    },
    [managedGroupsMap],
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
      <div className="flex flex-col gap-10">
        {departments.map((dept) => {
          const sorted = [...dept.users].sort(
            (a, b) =>
              (SORT_ORDER[a.role] ?? 99) - (SORT_ORDER[b.role] ?? 99) ||
              a.fullName.localeCompare(b.fullName, "fr"),
          );

          return (
            <section key={dept.id}>
              {/* Department header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-facamBlue shadow-sm">
                  <Building2 size={17} className="text-facamWhite" />
                </div>
                <h2 className="min-w-0 flex-1 truncate text-base font-bold text-facamDark">
                  {dept.name}
                </h2>
                <span className="shrink-0 rounded-full bg-gray100 px-2.5 py-0.5 text-xs text-gray500">
                  {sorted.length} pers.
                </span>
                <div className="hidden flex-1 border-t border-gray200 sm:block" />
              </div>

              {sorted.length === 0 ? (
                <p className="ml-12 text-sm text-gray400">
                  Aucune personne dans ce département.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {sorted.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      isManager={managerIds.has(person.id)}
                      onClick={() => handleClick(person, dept.name)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <PersonDetailPanel ctx={selectedCtx} onClose={handleClose} />
    </>
  );
}
