import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { OverdueCommitteeAction } from "@/components/actions-to-process/types";

type Props = {
  action: OverdueCommitteeAction;
};

export function CommitteeActionOverdueCard({ action }: Props) {
  return (
    <div className="flex items-center justify-between rounded-[--radius-xl] border border-[--color-gray-200] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[--radius-lg] bg-[--color-errorLight]">
          <AlertTriangle className="h-5 w-5 text-[--color-error]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[--color-errorLight] px-2 py-0.5 text-xs font-medium text-[--color-error]">
              {action.overdueDays} jour{action.overdueDays > 1 ? "s" : ""} de retard
            </span>
          </div>
          <p className="text-sm font-semibold text-[--color-facamDark]">{action.title}</p>
          <p className="text-xs text-[--color-gray-500]">
            {action.committeeName} &mdash; Responsable : {action.responsibleName}
          </p>
          <p className="text-xs text-[--color-gray-400]">
            Échéance : {new Date(action.dueDate).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <Link
        href="/committees"
        className="flex flex-shrink-0 items-center gap-1 rounded-[--radius-md] border border-[--color-gray-200] px-3 py-1.5 text-xs font-medium text-[--color-facamBlue] transition-colors hover:bg-[--color-facamBlueTint]"
      >
        Voir le comité
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
