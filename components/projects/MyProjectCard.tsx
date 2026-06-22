import { CalendarDays, User } from "lucide-react";

export type CollaboratorProject = {
  id: string;
  name: string;
  description: string;
  estimatedStartDate: string;
  targetEndDate: string;
  projectManager: { fullName: string };
};

type Props = {
  project: CollaboratorProject;
};

export function MyProjectCard({ project }: Props) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray200 bg-facamWhite p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-facamDark leading-snug">{project.name}</h3>

      <p className="text-xs text-gray500 line-clamp-2">{project.description}</p>

      <div className="flex flex-col gap-1.5 pt-1 border-t border-gray100">
        <div className="flex items-center gap-2 text-xs text-gray500">
          <User size={12} className="flex-shrink-0 text-gray400" />
          <span>{project.projectManager.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray500">
          <CalendarDays size={12} className="flex-shrink-0 text-gray400" />
          <span>
            {fmt(project.estimatedStartDate)} → {fmt(project.targetEndDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
