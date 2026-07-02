import type { MilestoneStatus } from "@/lib/schemas/project";

type Props = {
  status: MilestoneStatus;
};

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; className: string }> = {
  PENDING: { label: "Prévu", className: "bg-gray100 text-gray600" },
  IN_PROGRESS: { label: "En cours", className: "bg-warningLight text-warning" },
  DONE: { label: "Atteint", className: "bg-successLight text-success" },
  DELAYED: { label: "En retard", className: "bg-errorLight text-error" },
};

export function MilestoneStatusBadge({ status }: Props) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
