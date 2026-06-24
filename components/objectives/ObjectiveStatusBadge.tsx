import type { KeyResultStatus, ObjectiveType } from "./types";

const KR_STATUS_CONFIG: Record<KeyResultStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: "Non démarré", className: "bg-gray100 text-gray500" },
  IN_PROGRESS: { label: "En cours",    className: "bg-warningLight text-warning" },
  DONE:        { label: "Terminé",     className: "bg-successLight text-success" },
};

export function KRStatusBadge({ status }: { status: KeyResultStatus }) {
  const { label, className } = KR_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

export function ObjectiveTypeBadge({ type }: { type: ObjectiveType }) {
  if (type === "PERFORMANCE") {
    return (
      <span className="inline-flex items-center rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-medium text-facamBlue">
        Performance
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-successLight px-2 py-0.5 text-[10px] font-medium text-success">
      Développement
    </span>
  );
}
