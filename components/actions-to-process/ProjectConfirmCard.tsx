import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { PendingProject } from "@/components/actions-to-process/types";

type Props = {
  project: PendingProject;
};

export function ProjectConfirmCard({ project }: Props) {
  return (
    <div className="flex items-center justify-between rounded-[--radius-xl] border border-[--color-gray-200] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[--radius-lg] bg-[--color-facamBlueTint]">
          <FolderOpen className="h-5 w-5 text-[--color-facamBlue]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[--color-gray-500]">{project.code}</span>
            <span className="rounded-full bg-[--color-facamBlueTint] px-2 py-0.5 text-xs font-medium text-[--color-facamBlue]">
              {project.strategicPriority}
            </span>
          </div>
          <p className="text-sm font-semibold text-[--color-facamDark]">{project.name}</p>
          <p className="text-xs text-[--color-gray-500]">
            {project.category} &mdash; Manager : {project.managerName}
          </p>
          <p className="text-xs text-[--color-gray-400]">
            Soumis le {new Date(project.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <Link
        href="/projects"
        className="flex flex-shrink-0 items-center gap-1 rounded-[--radius-md] border border-[--color-gray-200] px-3 py-1.5 text-xs font-medium text-[--color-facamBlue] transition-colors hover:bg-[--color-facamBlueTint]"
      >
        Voir le projet
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
