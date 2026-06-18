"use client";

import Link from "next/link";
import { Plus, CheckCircle2, Clock } from "lucide-react";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

export type MockProject = {
  id: string;
  code: string;
  name: string;
  projectManager: string;
  currentStatus:
    | "PENDING"
    | "INITIATED"
    | "IN_PROGRESS"
    | "PAUSED"
    | "DELIVERED"
    | "CANCELLED";
  isConfirmed: boolean;
  progressPercent: number;
  targetEndDate: string;
};

type Props = {
  projects: MockProject[];
};

export function ProjectList({ projects }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-facamDark">
            Tous les projets
          </h2>
          <p className="mt-0.5 text-xs text-gray500">
            {projects.length} projet{projects.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
        >
          <Plus size={16} />
          Nouveau projet
        </Link>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="text-sm text-gray400">Aucun projet pour le moment.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
            >
              <Plus size={16} />
              Créer un projet
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray200">
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Projet
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Chef de Projet
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Confirmation
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Avancement
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-gray200 last:border-0 hover:bg-gray50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-gray500">
                      {project.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-medium text-facamBlue hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-facamBlack">
                      {project.projectManager}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ProjectStatusBadge status={project.currentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    {project.isConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 size={13} />
                        Confirmé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                        <Clock size={13} />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.progressPercent >= 90
                              ? "bg-error"
                              : project.progressPercent >= 70
                                ? "bg-facamYellow"
                                : "bg-facamBlue"
                          }`}
                          style={{ width: `${project.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray500">
                        {project.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-facamBlack">
                      {new Date(project.targetEndDate).toLocaleDateString(
                        "fr-FR",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
