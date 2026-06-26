"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Building2,
  FolderOpen,
  Users,
  Network,
  Shield,
} from "lucide-react";
import { deleteDepartment, deleteSubDepartment, deleteTeam } from "@/actions/org-chart";
import { DepartmentFormModal } from "@/components/org-chart/DepartmentFormModal";
import { SubDepartmentFormModal } from "@/components/org-chart/SubDepartmentFormModal";
import { TeamFormModal } from "@/components/org-chart/TeamFormModal";
import type { OrgDeptNode, OrgSubDept, OrgTeam, OrgUser } from "@/app/org-chart/page";

// ── Types ─────────────────────────────────────────────────────────────────────

type AllDept = { id: string; name: string; parentDepartmentId: string | null };

type Props = {
  deptTree: OrgDeptNode[];
  allDepts: AllDept[];
  allUsers: { id: string; fullName: string; role: string }[];
  isAdmin: boolean;
};

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLE_SHORT: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COLLABORATOR: "Collab.",
  INTERN: "Stagiaire",
};

const MEMBER_BADGE: Record<string, string> = {
  ADMIN: "bg-facamYellow text-facamDark",
  MANAGER: "bg-facamBlueTint text-facamBlue",
  COLLABORATOR: "bg-gray100 text-gray600",
  INTERN: "bg-gray100 text-gray500",
};

const AVATAR_BG: Record<string, string> = {
  ADMIN: "bg-facamBlue text-facamWhite",
  MANAGER: "bg-facamYellow text-facamDark",
  COLLABORATOR: "bg-facamBlueTint text-facamBlue",
  INTERN: "bg-gray100 text-gray600",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function ActionBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray400 transition-colors hover:bg-facamBlueTint hover:text-facamBlue"
    >
      {children}
    </button>
  );
}

function DeleteButton({ onConfirm, isPending }: { onConfirm: () => void; isPending: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="text-error hover:underline disabled:opacity-50"
        >
          Confirmer
        </button>
        <span className="text-gray300">|</span>
        <button onClick={() => setConfirming(false)} className="text-gray500 hover:underline">
          Annuler
        </button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      title="Supprimer"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray400 transition-colors hover:bg-errorLight hover:text-error"
    >
      <Trash2 size={13} />
    </button>
  );
}

// Chips membres dans une équipe dépliée
function MemberChip({ member }: { member: OrgUser }) {
  const avatarClass = AVATAR_BG[member.role] ?? AVATAR_BG.COLLABORATOR;
  const badgeClass = MEMBER_BADGE[member.role] ?? MEMBER_BADGE.COLLABORATOR;
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray200 bg-facamWhite px-2.5 py-1.5 shadow-sm">
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${avatarClass}`}
      >
        {initials(member.fullName)}
      </div>
      <span className="whitespace-nowrap text-xs font-medium text-facamDark">
        {member.fullName}
      </span>
      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${badgeClass}`}>
        {ROLE_SHORT[member.role] ?? member.role}
      </span>
    </div>
  );
}

// Cluster de miniatures d'avatars (affiché sur la carte équipe)
function AvatarCluster({ members }: { members: OrgUser[] }) {
  const shown = members.slice(0, 4);
  const rest = members.length - 4;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((m) => {
          const cls = AVATAR_BG[m.role] ?? AVATAR_BG.COLLABORATOR;
          return (
            <div
              key={m.id}
              title={m.fullName}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-facamWhite text-[8px] font-bold ${cls}`}
            >
              {initials(m.fullName)}
            </div>
          );
        })}
      </div>
      {rest > 0 && (
        <span className="ml-1.5 text-[10px] font-medium text-gray400">+{rest}</span>
      )}
    </div>
  );
}

// ── Nœud Équipe ───────────────────────────────────────────────────────────────

function TeamNode({
  team,
  subDeptId,
  isAdmin,
  isPending,
  expandedTeams,
  toggleTeam,
  onEditTeam,
  onDeleteTeam,
}: {
  team: OrgTeam;
  subDeptId: string;
  isAdmin: boolean;
  isPending: boolean;
  expandedTeams: Set<string>;
  toggleTeam: (id: string) => void;
  onEditTeam: (subDeptId: string, team: OrgTeam) => void;
  onDeleteTeam: (id: string) => void;
}) {
  const expanded = expandedTeams.has(team.id);
  return (
    <div>
      {/* Carte équipe */}
      <div className="flex items-center gap-3 rounded-xl border border-gray200 bg-facamWhite p-3 shadow-sm transition-shadow hover:shadow-md">
        <button
          onClick={() => toggleTeam(team.id)}
          disabled={team.members.length === 0}
          className="text-gray300 hover:text-facamBlue disabled:cursor-default disabled:opacity-40"
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {/* Icône */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray100">
          <Users size={14} className="text-gray500" />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-facamDark">{team.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {team.manager && (
              <span className="flex items-center gap-1 text-[10px] text-gray400">
                <Shield size={9} className="text-facamBlue" />
                {team.manager.fullName}
              </span>
            )}
            {team.manager && team.members.length > 0 && (
              <span className="text-[10px] text-gray300">·</span>
            )}
            {team.members.length > 0 && (
              <span className="text-[10px] text-gray400">
                {team.members.length} membre{team.members.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Cluster avatars */}
        {team.members.length > 0 && !expanded && (
          <AvatarCluster members={team.members} />
        )}

        {isAdmin && (
          <div className="flex items-center gap-0.5">
            <ActionBtn title="Modifier" onClick={() => onEditTeam(subDeptId, team)}>
              <Pencil size={13} />
            </ActionBtn>
            <DeleteButton onConfirm={() => onDeleteTeam(team.id)} isPending={isPending} />
          </div>
        )}
      </div>

      {/* Membres */}
      {expanded && (
        <div className="ml-6 mt-2 border-l border-gray200 pl-4">
          {team.members.length === 0 ? (
            <p className="py-2 text-xs text-gray400">Aucun membre.</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {team.members.map((m) => (
                <MemberChip key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Nœud Sous-département ─────────────────────────────────────────────────────

function SubDeptNode({
  subDept,
  deptId,
  isAdmin,
  isPending,
  expandedSubdepts,
  expandedTeams,
  toggleSubdept,
  toggleTeam,
  onAddTeam,
  onEditSubDept,
  onDeleteSubDept,
  onEditTeam,
  onDeleteTeam,
}: {
  subDept: OrgSubDept;
  deptId: string;
  isAdmin: boolean;
  isPending: boolean;
  expandedSubdepts: Set<string>;
  expandedTeams: Set<string>;
  toggleSubdept: (id: string) => void;
  toggleTeam: (id: string) => void;
  onAddTeam: (subDeptId: string) => void;
  onEditSubDept: (deptId: string, subDept: OrgSubDept) => void;
  onDeleteSubDept: (id: string) => void;
  onEditTeam: (subDeptId: string, team: OrgTeam) => void;
  onDeleteTeam: (id: string) => void;
}) {
  const expanded = expandedSubdepts.has(subDept.id);
  const hasTeams = subDept.teams.length > 0;

  return (
    <div>
      {/* Carte sous-département */}
      <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm transition-shadow hover:shadow-md">
        <div className="h-0.5 w-full bg-facamYellow" />
        <div className="flex items-center gap-3 p-3">
          <button
            onClick={() => toggleSubdept(subDept.id)}
            disabled={!hasTeams}
            className="text-gray300 hover:text-facamBlue disabled:cursor-default disabled:opacity-40"
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warningLight">
            <FolderOpen size={14} className="text-warning" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-facamDark">{subDept.name}</p>
            <p className="text-[10px] text-gray400">
              {subDept.teams.length} équipe{subDept.teams.length !== 1 ? "s" : ""}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-0.5">
              <ActionBtn title="Ajouter une équipe" onClick={() => onAddTeam(subDept.id)}>
                <Plus size={13} />
              </ActionBtn>
              <ActionBtn title="Modifier" onClick={() => onEditSubDept(deptId, subDept)}>
                <Pencil size={13} />
              </ActionBtn>
              <DeleteButton onConfirm={() => onDeleteSubDept(subDept.id)} isPending={isPending} />
            </div>
          )}
        </div>
      </div>

      {/* Équipes */}
      {expanded && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-facamYellow/25 pl-4">
          {subDept.teams.length === 0 && (
            <p className="py-2 text-xs text-gray400">Aucune équipe.</p>
          )}
          {subDept.teams.map((team) => (
            <TeamNode
              key={team.id}
              team={team}
              subDeptId={subDept.id}
              isAdmin={isAdmin}
              isPending={isPending}
              expandedTeams={expandedTeams}
              toggleTeam={toggleTeam}
              onEditTeam={onEditTeam}
              onDeleteTeam={onDeleteTeam}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nœud Département (récursif) ───────────────────────────────────────────────

function DeptNode({
  dept,
  depth,
  isAdmin,
  isPending,
  expandedDepts,
  expandedSubdepts,
  expandedTeams,
  toggleDept,
  toggleSubdept,
  toggleTeam,
  onAddChildDept,
  onEditDept,
  onDeleteDept,
  onAddSubDept,
  onEditSubDept,
  onDeleteSubDept,
  onAddTeam,
  onEditTeam,
  onDeleteTeam,
}: {
  dept: OrgDeptNode;
  depth: number;
  isAdmin: boolean;
  isPending: boolean;
  expandedDepts: Set<string>;
  expandedSubdepts: Set<string>;
  expandedTeams: Set<string>;
  toggleDept: (id: string) => void;
  toggleSubdept: (id: string) => void;
  toggleTeam: (id: string) => void;
  onAddChildDept: (parentId: string) => void;
  onEditDept: (dept: OrgDeptNode) => void;
  onDeleteDept: (id: string) => void;
  onAddSubDept: (deptId: string) => void;
  onEditSubDept: (deptId: string, subDept: OrgSubDept) => void;
  onDeleteSubDept: (id: string) => void;
  onAddTeam: (subDeptId: string) => void;
  onEditTeam: (subDeptId: string, team: OrgTeam) => void;
  onDeleteTeam: (id: string) => void;
}) {
  const expanded = expandedDepts.has(dept.id);
  const hasContent = dept.children.length > 0 || dept.subDepartments.length > 0;
  const isRoot = depth === 0;

  const childCount = dept.children.length;
  const subDeptCount = dept.subDepartments.length;

  return (
    <div>
      {/* ── Carte département ── */}
      <div
        className={`overflow-hidden rounded-xl border bg-facamWhite shadow-sm transition-shadow hover:shadow-md ${
          isRoot ? "border-gray200" : "border-facamBlue/20"
        }`}
      >
        {/* Barre accent colorée en haut */}
        <div className={`w-full ${isRoot ? "h-1 bg-facamBlue" : "h-0.5 bg-facamBlueMid"}`} />

        <div className={`flex items-center gap-3 ${isRoot ? "p-4" : "p-3"}`}>
          {/* Chevron d'expansion */}
          <button
            onClick={() => toggleDept(dept.id)}
            disabled={!hasContent}
            className="text-gray300 transition-colors hover:text-facamBlue disabled:cursor-default disabled:opacity-40"
          >
            {expanded ? (
              <ChevronDown size={isRoot ? 18 : 15} />
            ) : (
              <ChevronRight size={isRoot ? 18 : 15} />
            )}
          </button>

          {/* Icône */}
          <div
            className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-facamBlueTint ${
              isRoot ? "h-10 w-10" : "h-8 w-8"
            }`}
          >
            <Building2
              size={isRoot ? 18 : 15}
              className={isRoot ? "text-facamBlue" : "text-facamBlueMid"}
            />
          </div>

          {/* Nom + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`truncate ${
                  isRoot ? "text-sm font-semibold" : "text-sm font-medium"
                } text-facamDark`}
              >
                {dept.name}
              </p>
              {!isRoot && (
                <span className="shrink-0 rounded-full bg-facamBlueTint px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-facamBlue">
                  Dép.
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {childCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-gray400">
                  <Network size={9} />
                  {childCount} dép. enfant{childCount !== 1 ? "s" : ""}
                </span>
              )}
              {childCount > 0 && subDeptCount > 0 && (
                <span className="text-[10px] text-gray300">·</span>
              )}
              {subDeptCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-gray400">
                  <FolderOpen size={9} />
                  {subDeptCount} sous-dép{subDeptCount !== 1 ? "." : "."}
                </span>
              )}
              {!hasContent && (
                <span className="text-[10px] text-gray300">Aucune structure</span>
              )}
            </div>
          </div>

          {/* Actions admin */}
          {isAdmin && (
            <div className="flex items-center gap-0.5">
              <ActionBtn
                title="Ajouter un département enfant"
                onClick={() => onAddChildDept(dept.id)}
              >
                <Network size={isRoot ? 14 : 13} />
              </ActionBtn>
              <ActionBtn
                title="Ajouter un sous-département"
                onClick={() => onAddSubDept(dept.id)}
              >
                <Plus size={isRoot ? 14 : 13} />
              </ActionBtn>
              <ActionBtn title="Modifier" onClick={() => onEditDept(dept)}>
                <Pencil size={isRoot ? 14 : 13} />
              </ActionBtn>
              <DeleteButton onConfirm={() => onDeleteDept(dept.id)} isPending={isPending} />
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu déplié ── */}
      {expanded && (
        <div
          className={`ml-6 mt-2 space-y-2 border-l-2 pl-4 ${
            isRoot ? "border-facamBlue/15" : "border-facamBlueMid/15"
          }`}
        >
          {/* Départements enfants (récursif) */}
          {dept.children.map((child) => (
            <DeptNode
              key={child.id}
              dept={child}
              depth={depth + 1}
              isAdmin={isAdmin}
              isPending={isPending}
              expandedDepts={expandedDepts}
              expandedSubdepts={expandedSubdepts}
              expandedTeams={expandedTeams}
              toggleDept={toggleDept}
              toggleSubdept={toggleSubdept}
              toggleTeam={toggleTeam}
              onAddChildDept={onAddChildDept}
              onEditDept={onEditDept}
              onDeleteDept={onDeleteDept}
              onAddSubDept={onAddSubDept}
              onEditSubDept={onEditSubDept}
              onDeleteSubDept={onDeleteSubDept}
              onAddTeam={onAddTeam}
              onEditTeam={onEditTeam}
              onDeleteTeam={onDeleteTeam}
            />
          ))}

          {/* Sous-départements directs */}
          {dept.subDepartments.map((sd) => (
            <SubDeptNode
              key={sd.id}
              subDept={sd}
              deptId={dept.id}
              isAdmin={isAdmin}
              isPending={isPending}
              expandedSubdepts={expandedSubdepts}
              expandedTeams={expandedTeams}
              toggleSubdept={toggleSubdept}
              toggleTeam={toggleTeam}
              onAddTeam={onAddTeam}
              onEditSubDept={onEditSubDept}
              onDeleteSubDept={onDeleteSubDept}
              onEditTeam={onEditTeam}
              onDeleteTeam={onDeleteTeam}
            />
          ))}

          {!hasContent && (
            <p className="py-2 text-xs text-gray400">Aucune structure dans ce département.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── OrgTree principal ─────────────────────────────────────────────────────────

export function OrgTree({ deptTree, allDepts, allUsers, isAdmin }: Props) {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(deptTree.map((d) => d.id)),
  );
  const [expandedSubdepts, setExpandedSubdepts] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [deptModal, setDeptModal] = useState<{
    open: boolean;
    dept?: OrgDeptNode;
    parentDepartmentId?: string;
  }>({ open: false });

  const [subDeptModal, setSubDeptModal] = useState<{
    open: boolean;
    departmentId?: string;
    subDept?: OrgSubDept;
  }>({ open: false });

  const [teamModal, setTeamModal] = useState<{
    open: boolean;
    subDepartmentId?: string;
    team?: OrgTeam;
  }>({ open: false });

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  }

  function handleDeleteDept(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await deleteDepartment(id);
      if (!r.success) setError(r.error ?? "Erreur lors de la suppression.");
    });
  }

  function handleDeleteSubDept(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await deleteSubDepartment(id);
      if (!r.success) setError(r.error ?? "Erreur lors de la suppression.");
    });
  }

  function handleDeleteTeam(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await deleteTeam(id);
      if (!r.success) setError(r.error ?? "Erreur lors de la suppression.");
    });
  }

  if (deptTree.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray200 bg-facamWhite p-12 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-facamBlueTint">
            <Building2 size={28} className="text-facamBlue" />
          </div>
          <div>
            <p className="text-sm font-semibold text-facamDark">Aucun département</p>
            <p className="mt-1 text-xs text-gray400">
              Commencez par créer le département racine de votre organisation.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setDeptModal({ open: true })}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
            >
              <Plus size={14} /> Créer un département
            </button>
          )}
        </div>
        <DepartmentFormModal
          key={`empty-${String(deptModal.open)}`}
          open={deptModal.open}
          allDepts={allDepts}
          onClose={() => setDeptModal({ open: false })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Erreur globale */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-errorLight px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 font-semibold hover:underline">
            ×
          </button>
        </div>
      )}

      {/* Barre d'actions (Admin) */}
      {isAdmin && (
        <div className="flex items-center justify-between rounded-xl border border-gray200 bg-facamWhite px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4 text-[11px] text-gray400">
            <span className="flex items-center gap-1.5">
              <Network size={11} className="text-facamBlue" />
              <span>= Département enfant</span>
            </span>
            <span className="text-gray300">·</span>
            <span className="flex items-center gap-1.5">
              <Plus size={11} className="text-facamBlue" />
              <span>= Sous-département</span>
            </span>
          </div>
          <button
            onClick={() => setDeptModal({ open: true })}
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
          >
            <Plus size={14} /> Ajouter un département
          </button>
        </div>
      )}

      {/* Légende des niveaux */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-facamBlue" />
          <span className="text-[10px] text-gray400">Département mère</span>
        </div>
        <span className="text-gray300 text-[10px]">·</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-facamBlueMid" />
          <span className="text-[10px] text-gray400">Département enfant</span>
        </div>
        <span className="text-gray300 text-[10px]">·</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-facamYellow" />
          <span className="text-[10px] text-gray400">Sous-département</span>
        </div>
        <span className="text-gray300 text-[10px]">·</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-gray200" />
          <span className="text-[10px] text-gray400">Équipe</span>
        </div>
      </div>

      {/* Arbre */}
      <div className="flex flex-col gap-3">
        {deptTree.map((dept) => (
          <DeptNode
            key={dept.id}
            dept={dept}
            depth={0}
            isAdmin={isAdmin}
            isPending={isPending}
            expandedDepts={expandedDepts}
            expandedSubdepts={expandedSubdepts}
            expandedTeams={expandedTeams}
            toggleDept={(id) => setExpandedDepts(toggle(expandedDepts, id))}
            toggleSubdept={(id) => setExpandedSubdepts(toggle(expandedSubdepts, id))}
            toggleTeam={(id) => setExpandedTeams(toggle(expandedTeams, id))}
            onAddChildDept={(parentId) =>
              setDeptModal({ open: true, parentDepartmentId: parentId })
            }
            onEditDept={(d) => setDeptModal({ open: true, dept: d })}
            onDeleteDept={handleDeleteDept}
            onAddSubDept={(deptId) => setSubDeptModal({ open: true, departmentId: deptId })}
            onEditSubDept={(deptId, subDept) =>
              setSubDeptModal({ open: true, departmentId: deptId, subDept })
            }
            onDeleteSubDept={handleDeleteSubDept}
            onAddTeam={(subDeptId) => setTeamModal({ open: true, subDepartmentId: subDeptId })}
            onEditTeam={(subDeptId, team) =>
              setTeamModal({ open: true, subDepartmentId: subDeptId, team })
            }
            onDeleteTeam={handleDeleteTeam}
          />
        ))}
      </div>

      {/* Modales */}
      <DepartmentFormModal
        key={`${deptModal.dept?.id ?? "new"}-${deptModal.parentDepartmentId ?? ""}-${String(deptModal.open)}`}
        open={deptModal.open}
        dept={deptModal.dept}
        parentDepartmentId={deptModal.parentDepartmentId}
        allDepts={allDepts}
        onClose={() => setDeptModal({ open: false })}
      />
      <SubDepartmentFormModal
        open={subDeptModal.open}
        departmentId={subDeptModal.departmentId}
        subDept={subDeptModal.subDept}
        onClose={() => setSubDeptModal({ open: false })}
      />
      <TeamFormModal
        open={teamModal.open}
        subDepartmentId={teamModal.subDepartmentId}
        team={teamModal.team}
        allUsers={allUsers}
        onClose={() => setTeamModal({ open: false })}
      />
    </div>
  );
}
