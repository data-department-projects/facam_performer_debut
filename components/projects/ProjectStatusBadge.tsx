type ProjectStatus =
  | "PENDING"
  | "INITIATED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "DELIVERED"
  | "CANCELLED";

type Props = {
  status: ProjectStatus;
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-gray100 text-gray600" },
  INITIATED: { label: "Initié", className: "bg-facamBlueTint text-facamBlue" },
  IN_PROGRESS: { label: "En cours", className: "bg-warningLight text-warning" },
  PAUSED: { label: "En pause", className: "bg-gray100 text-gray500" },
  DELIVERED: { label: "Livré", className: "bg-successLight text-success" },
  CANCELLED: { label: "Annulé", className: "bg-errorLight text-error" },
};

export function ProjectStatusBadge({ status }: Props) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
