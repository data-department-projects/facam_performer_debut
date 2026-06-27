"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, Mail, Building2, Users, Shield, UserCircle2 } from "lucide-react";
import type { UserNode } from "@/app/org-chart/page";

// ── Constantes ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

const AVATAR_STYLE: Record<string, { bg: string; fg: string }> = {
  ADMIN: { bg: "var(--color-facamBlue)", fg: "var(--color-facamWhite)" },
  MANAGER: { bg: "var(--color-facamYellow)", fg: "var(--color-facamDark)" },
  COLLABORATOR: { bg: "var(--color-facamBlueTint)", fg: "var(--color-facamBlue)" },
  INTERN: { bg: "var(--color-gray200)", fg: "var(--color-gray500)" },
};

const BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-facamBlue text-facamWhite",
  MANAGER: "bg-facamYellow text-facamDark",
  COLLABORATOR: "bg-facamBlueTint text-facamBlue",
  INTERN: "bg-gray100 text-gray500",
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
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const s = AVATAR_STYLE[role] ?? AVATAR_STYLE.COLLABORATOR;
  const cls = {
    sm: "h-10 w-10 text-xs",
    md: "h-14 w-14 text-sm",
    lg: "h-20 w-20 text-xl",
    xl: "h-24 w-24 text-2xl",
  }[size];
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-facamWhite shadow-md`}
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Compact card (Manager & Subordonnés) ──────────────────────────────────────

function CompactCard({
  user,
  label,
  onClick,
  isManager = false,
}: {
  user: UserNode;
  label?: string;
  onClick: () => void;
  isManager?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray400">
          {label}
        </p>
      )}
      <button
        onClick={onClick}
        className={`group flex w-full flex-col items-center gap-3 rounded-2xl border px-4 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-facamBlue ${
          isManager
            ? "border-facamBlue/20 bg-facamBlueTint hover:border-facamBlue/40"
            : "border-gray200 bg-facamWhite hover:border-gray300"
        }`}
      >
        <div className="relative">
          <Avatar name={user.fullName} role={user.role} size="sm" />
          {/* Indicateur de rôle */}
          {(user.role === "ADMIN" || user.role === "MANAGER") && (
            <span
              className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-facamWhite ${
                user.role === "ADMIN" ? "bg-facamBlue" : "bg-facamYellow"
              }`}
            >
              <Shield size={9} className={user.role === "ADMIN" ? "text-facamWhite" : "text-facamDark"} />
            </span>
          )}
        </div>
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold text-facamDark leading-tight">
            {user.fullName}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
              BADGE_CLASS[user.role] ?? BADGE_CLASS.COLLABORATOR
            }`}
          >
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <p className="mt-1 truncate text-[10px] text-gray400">{user.departmentName}</p>
          {user.teamName && (
            <p className="truncate text-[10px] text-gray400">{user.teamName}</p>
          )}
        </div>
        <span className="text-[10px] font-medium text-facamBlue opacity-0 transition-opacity group-hover:opacity-100">
          Voir le profil →
        </span>
      </button>
    </div>
  );
}

// ── Focused card (personne au centre) ─────────────────────────────────────────

function FocusedCard({
  user,
  directReportCount,
}: {
  user: UserNode;
  directReportCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-facamBlue/30 bg-facamWhite px-8 py-8 shadow-xl">
      {/* Avatar */}
      <div className="relative">
        <Avatar name={user.fullName} role={user.role} size="xl" />
        {(user.role === "ADMIN" || user.role === "MANAGER") && (
          <span
            className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-facamWhite shadow ${
              user.role === "ADMIN" ? "bg-facamBlue" : "bg-facamYellow"
            }`}
          >
            <Shield size={13} className={user.role === "ADMIN" ? "text-facamWhite" : "text-facamDark"} />
          </span>
        )}
      </div>

      {/* Nom + rôle */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-facamDark">{user.fullName}</h2>
        <span
          className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
            BADGE_CLASS[user.role] ?? BADGE_CLASS.COLLABORATOR
          }`}
        >
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>

      {/* Infos */}
      <div className="flex w-full flex-col gap-3 rounded-xl border border-gray100 bg-gray50 p-4">
        <div className="flex items-center gap-3">
          <Mail size={14} className="shrink-0 text-gray400" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">Email</p>
            <p className="break-all text-sm text-facamDark">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Building2 size={14} className="shrink-0 text-gray400" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">Département</p>
            <p className="text-sm font-medium text-facamDark">{user.departmentName}</p>
          </div>
        </div>
        {user.teamName && (
          <div className="flex items-center gap-3">
            <Users size={14} className="shrink-0 text-gray400" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">Équipe</p>
              <p className="text-sm font-medium text-facamDark">{user.teamName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-[11px] text-gray400">
        <UserCircle2 size={12} />
        <span>
          {directReportCount}{" "}
          {directReportCount !== 1 ? "personnes rapportent" : "personne rapporte"} à{" "}
          {user.fullName.split(" ")[0]}
        </span>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-facamBlue">
        FACAM STAIRWAY
      </p>
    </div>
  );
}

// ── TeamsOrgView ───────────────────────────────────────────────────────────────

type Props = {
  userNodes: UserNode[];
  currentUserId: string;
};

export function TeamsOrgView({ userNodes, currentUserId }: Props) {
  const [focusedId, setFocusedId] = useState<string>(currentUserId);
  const [history, setHistory] = useState<string[]>([]);

  // Index pour lookup O(1)
  const nodeMap = useMemo(() => {
    const m = new Map<string, UserNode>();
    for (const u of userNodes) m.set(u.id, u);
    return m;
  }, [userNodes]);

  const focused = nodeMap.get(focusedId);
  const manager = focused?.managerId ? nodeMap.get(focused.managerId) : undefined;
  const directReports = useMemo(
    () => (focused?.directReportIds ?? []).map((id) => nodeMap.get(id)).filter(Boolean) as UserNode[],
    [focused, nodeMap],
  );

  const navigateTo = useCallback(
    (userId: string) => {
      setHistory((h) => [...h, focusedId]);
      setFocusedId(userId);
    },
    [focusedId],
  );

  const navigateBack = useCallback(() => {
    setHistory((h) => {
      const next = [...h];
      const prev = next.pop();
      if (prev) setFocusedId(prev);
      return next;
    });
  }, []);

  if (!focused) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
        <Users size={32} className="text-gray300" />
        <p className="text-sm text-gray500">Aucun collaborateur trouvé.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 py-4">
      {/* Bouton retour */}
      {history.length > 0 && (
        <div className="w-full max-w-lg">
          <button
            onClick={navigateBack}
            className="flex items-center gap-2 rounded-lg border border-gray200 bg-facamWhite px-3 py-2 text-sm font-medium text-facamDark shadow-sm transition-colors hover:bg-gray50"
          >
            <ChevronLeft size={16} />
            Retour
          </button>
        </div>
      )}

      {/* Manager */}
      {manager ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <CompactCard
            user={manager}
            label="Responsable hiérarchique"
            onClick={() => navigateTo(manager.id)}
            isManager
          />
          {/* Connecteur vertical */}
          <div className="h-8 w-px bg-gray200" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-dashed border-gray200 bg-gray50 px-4 py-2">
            <Shield size={12} className="text-gray300" />
            <span className="text-[11px] text-gray400">Sommet de la hiérarchie</span>
          </div>
          <div className="h-8 w-px bg-gray200" />
        </div>
      )}

      {/* Personne focalisée */}
      <div className="w-full max-w-sm">
        <FocusedCard user={focused} directReportCount={directReports.length} />
      </div>

      {/* Connecteur + subordonnés */}
      {directReports.length > 0 && (
        <>
          <div className="flex flex-col items-center gap-0">
            <div className="h-8 w-px bg-gray200" />
            <div className="flex items-center gap-2 rounded-full border border-gray200 bg-facamWhite px-4 py-1.5 shadow-sm">
              <Users size={12} className="text-facamBlue" />
              <span className="text-[11px] font-semibold text-gray500">
                Personnes qui rapportent à {focused.fullName.split(" ")[0]}
              </span>
              <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-bold text-facamBlue">
                {directReports.length}
              </span>
            </div>
          </div>

          <div
            className={`grid w-full gap-4 ${
              directReports.length === 1
                ? "max-w-xs grid-cols-1"
                : directReports.length === 2
                  ? "max-w-xl grid-cols-2"
                  : directReports.length <= 4
                    ? "max-w-2xl grid-cols-2 sm:grid-cols-4"
                    : "max-w-4xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            }`}
          >
            {directReports.map((report) => (
              <CompactCard
                key={report.id}
                user={report}
                onClick={() => navigateTo(report.id)}
              />
            ))}
          </div>
        </>
      )}

      {directReports.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray200 bg-gray50 px-5 py-4">
          <Users size={14} className="text-gray300" />
          <p className="text-xs text-gray400">
            Aucune personne ne rapporte directement à {focused.fullName.split(" ")[0]}.
          </p>
        </div>
      )}
    </div>
  );
}
