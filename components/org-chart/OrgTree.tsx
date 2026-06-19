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
  User,
} from "lucide-react";
import {
  deleteDepartment,
  deleteSubDepartment,
  deleteTeam,
} from "@/actions/org-chart";
import { DepartmentFormModal } from "@/components/org-chart/DepartmentFormModal";
import { SubDepartmentFormModal } from "@/components/org-chart/SubDepartmentFormModal";
import { TeamFormModal } from "@/components/org-chart/TeamFormModal";

type OrgUser = { id: string; fullName: string; email: string; role: string };
type OrgTeam = {
  id: string;
  name: string;
  subDepartmentId: string;
  manager: OrgUser | null;
  members: OrgUser[];
};
type OrgSubDept = {
  id: string;
  name: string;
  departmentId: string;
  teams: OrgTeam[];
};
type OrgDept = {
  id: string;
  name: string;
  subDepartments: OrgSubDept[];
};

type Props = {
  departments: OrgDept[];
  isAdmin: boolean;
  allUsers: { id: string; fullName: string; role: string }[];
};

function roleBadge(role: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: "bg-facamYellow", text: "text-facamDark", label: "Admin" },
    MANAGER: { bg: "bg-facamBlueTint", text: "text-facamBlue", label: "Manager" },
    COLLABORATOR: { bg: "bg-gray100", text: "text-gray600", label: "Collaborateur" },
  };
  const style = map[role] ?? map.COLLABORATOR;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function DeleteButton({
  onConfirm,
  isPending,
}: {
  onConfirm: () => void;
  isPending: boolean;
}) {
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
        <button
          onClick={() => setConfirming(false)}
          className="text-gray500 hover:underline"
        >
          Annuler
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Supprimer"
      className="text-gray400 hover:text-error"
    >
      <Trash2 size={14} />
    </button>
  );
}

export function OrgTree({ departments, isAdmin, allUsers }: Props) {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(departments.map((d) => d.id)),
  );
  const [expandedSubdepts, setExpandedSubdepts] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [deptModal, setDeptModal] = useState<{
    open: boolean;
    dept?: OrgDept;
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

  function toggleSet(set: Set<string>, id: string): Set<string> {
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
      const result = await deleteDepartment(id);
      if (!result.success) setError(result.error ?? "Erreur lors de la suppression.");
    });
  }

  function handleDeleteSubDept(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteSubDepartment(id);
      if (!result.success) setError(result.error ?? "Erreur lors de la suppression.");
    });
  }

  function handleDeleteTeam(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteTeam(id);
      if (!result.success) setError(result.error ?? "Erreur lors de la suppression.");
    });
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-gray200 bg-facamWhite p-12 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <Building2 size={36} className="text-gray300" />
          <p className="text-sm text-gray400">Aucun département créé pour le moment.</p>
          {isAdmin && (
            <button
              onClick={() => setDeptModal({ open: true })}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
            >
              <Plus size={14} /> Créer un département
            </button>
          )}
        </div>

        <DepartmentFormModal
          open={deptModal.open}
          dept={deptModal.dept}
          onClose={() => setDeptModal({ open: false })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Erreur globale (suppression bloquée) */}
      {error && (
        <div className="rounded-lg bg-errorLight px-4 py-3 text-sm text-error">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium hover:underline"
          >
            ×
          </button>
        </div>
      )}

      {/* Bouton "Créer un département" (Admin) */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setDeptModal({ open: true })}
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
          >
            <Plus size={14} /> Ajouter un département
          </button>
        </div>
      )}

      {/* Arbre */}
      {departments.map((dept) => {
        const deptExpanded = expandedDepts.has(dept.id);
        return (
          <div key={dept.id}>
            {/* ── Niveau 1 : Département ── */}
            <div className="flex items-center gap-3 rounded-xl border border-gray200 bg-facamWhite p-4 shadow-sm">
              <button
                onClick={() => setExpandedDepts(toggleSet(expandedDepts, dept.id))}
                className="text-gray400 hover:text-facamBlue"
                aria-label={deptExpanded ? "Réduire" : "Développer"}
              >
                {deptExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <Building2 size={16} className="flex-shrink-0 text-facamBlue" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-facamDark">{dept.name}</p>
                <p className="text-xs text-gray500">
                  {dept.subDepartments.length} sous-département
                  {dept.subDepartments.length !== 1 ? "s" : ""}
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubDeptModal({ open: true, departmentId: dept.id })}
                    title="Ajouter un sous-département"
                    className="text-gray400 hover:text-facamBlue"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setDeptModal({ open: true, dept })}
                    title="Modifier"
                    className="text-gray400 hover:text-facamBlue"
                  >
                    <Pencil size={14} />
                  </button>
                  <DeleteButton
                    onConfirm={() => handleDeleteDept(dept.id)}
                    isPending={isPending}
                  />
                </div>
              )}
            </div>

            {/* ── Sous-départements ── */}
            {deptExpanded && (
              <div className="ml-6 mt-2 space-y-2 border-l border-gray200 pl-4">
                {dept.subDepartments.length === 0 && (
                  <p className="py-2 text-sm text-gray400">Aucun sous-département.</p>
                )}
                {dept.subDepartments.map((subDept) => {
                  const subExpanded = expandedSubdepts.has(subDept.id);
                  return (
                    <div key={subDept.id}>
                      {/* ── Niveau 2 : Sous-département ── */}
                      <div className="flex items-center gap-3 rounded-xl border border-gray200 bg-facamWhite p-3 shadow-sm">
                        <button
                          onClick={() =>
                            setExpandedSubdepts(toggleSet(expandedSubdepts, subDept.id))
                          }
                          className="text-gray400 hover:text-facamBlue"
                        >
                          {subExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <FolderOpen size={14} className="flex-shrink-0 text-facamBlueMid" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-facamDark">{subDept.name}</p>
                          <p className="text-xs text-gray500">
                            {subDept.teams.length} équipe{subDept.teams.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setTeamModal({ open: true, subDepartmentId: subDept.id })
                              }
                              title="Ajouter une équipe"
                              className="text-gray400 hover:text-facamBlue"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={() =>
                                setSubDeptModal({ open: true, departmentId: dept.id, subDept })
                              }
                              title="Modifier"
                              className="text-gray400 hover:text-facamBlue"
                            >
                              <Pencil size={13} />
                            </button>
                            <DeleteButton
                              onConfirm={() => handleDeleteSubDept(subDept.id)}
                              isPending={isPending}
                            />
                          </div>
                        )}
                      </div>

                      {/* ── Équipes ── */}
                      {subExpanded && (
                        <div className="ml-6 mt-2 space-y-2 border-l border-gray200 pl-4">
                          {subDept.teams.length === 0 && (
                            <p className="py-2 text-sm text-gray400">Aucune équipe.</p>
                          )}
                          {subDept.teams.map((team) => {
                            const teamExpanded = expandedTeams.has(team.id);
                            return (
                              <div key={team.id}>
                                {/* ── Niveau 3 : Équipe ── */}
                                <div className="flex items-center gap-3 rounded-xl border border-gray200 bg-facamWhite p-3 shadow-sm">
                                  <button
                                    onClick={() =>
                                      setExpandedTeams(toggleSet(expandedTeams, team.id))
                                    }
                                    className="text-gray400 hover:text-facamBlue"
                                  >
                                    {teamExpanded ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                  </button>
                                  <Users size={14} className="flex-shrink-0 text-facamBlueMid" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-facamDark">
                                      {team.name}
                                    </p>
                                    {team.manager && (
                                      <p className="text-xs text-gray500">
                                        Responsable : {team.manager.fullName}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray500">
                                      {team.members.length} membre
                                      {team.members.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          setTeamModal({
                                            open: true,
                                            subDepartmentId: subDept.id,
                                            team,
                                          })
                                        }
                                        title="Modifier"
                                        className="text-gray400 hover:text-facamBlue"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <DeleteButton
                                        onConfirm={() => handleDeleteTeam(team.id)}
                                        isPending={isPending}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* ── Niveau 4 : Membres ── */}
                                {teamExpanded && (
                                  <div className="ml-6 mt-2 space-y-2 border-l border-gray200 pl-4">
                                    {team.members.length === 0 && (
                                      <p className="py-2 text-sm text-gray400">
                                        Aucun membre dans cette équipe.
                                      </p>
                                    )}
                                    {team.members.map((member) => (
                                      <div
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-lg border border-gray200 bg-facamWhite px-3 py-2"
                                      >
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
                                          {member.fullName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="truncate text-sm font-medium text-facamDark">
                                            {member.fullName}
                                          </p>
                                          <p className="truncate text-xs text-gray500">
                                            {member.email}
                                          </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                          {roleBadge(member.role)}
                                        </div>
                                        <User size={12} className="flex-shrink-0 text-gray300" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modales */}
      <DepartmentFormModal
        open={deptModal.open}
        dept={deptModal.dept}
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
