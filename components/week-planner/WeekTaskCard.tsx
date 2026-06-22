import { Trash2 } from "lucide-react";
import { TaskStatusBadge } from "./TaskStatusBadge";
import type { TaskStatus } from "./types";

type Props = {
  id: string;
  title: string;
  projectCode: string | null;
  status: TaskStatus;
  isLocked: boolean;
  onDelete: (id: string) => void;
};

export function WeekTaskCard({ id, title, projectCode, status, isLocked, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray200 bg-facamWhite p-3 shadow-sm">
      <p className="line-clamp-2 text-xs font-medium leading-snug text-facamDark">{title}</p>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[10px] text-gray400">{projectCode ?? "Hors-projet"}</span>
        <TaskStatusBadge status={status} />
      </div>
      {!isLocked && (
        <button
          onClick={() => onDelete(id)}
          className="self-end text-gray300 hover:text-error transition-colors"
          title="Supprimer la tâche"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
