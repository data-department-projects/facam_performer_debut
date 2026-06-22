import type { TaskStatus } from "./types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  STARTED:     { label: "Débuté",      className: "bg-facamBlueTint text-facamBlue" },
  IN_PROGRESS: { label: "En cours",    className: "bg-warningLight text-warning" },
  DONE:        { label: "Terminé",     className: "bg-successLight text-success" },
  NOT_DONE:    { label: "Non terminé", className: "bg-errorLight text-error" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}
