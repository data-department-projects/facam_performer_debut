"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { updateMyCommitteeActionStatus } from "@/actions/committees";

export type MyCommitteeAction = {
  id: string;
  title: string;
  dueDate: string;
  status: "PENDING" | "DONE";
  committeeName: string;
  meetingDate: string;
};

type Props = { actions: MyCommitteeAction[] };

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dueDate: string, status: "PENDING" | "DONE") {
  if (status === "DONE") return false;
  return new Date(dueDate + "T00:00:00") < new Date(new Date().toDateString());
}

export function MyCommitteeActionsList({ actions }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, "PENDING" | "DONE">>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function getStatus(action: MyCommitteeAction): "PENDING" | "DONE" {
    return optimistic[action.id] ?? action.status;
  }

  function handleToggle(action: MyCommitteeAction) {
    const currentStatus = getStatus(action);
    const newStatus = currentStatus === "DONE" ? "PENDING" : "DONE";
    setError(null);
    setPendingId(action.id);
    setOptimistic((prev) => ({ ...prev, [action.id]: newStatus }));

    startTransition(async () => {
      const result = await updateMyCommitteeActionStatus(action.id, newStatus);
      if (!result.success) {
        setOptimistic((prev) => ({ ...prev, [action.id]: currentStatus }));
        setError(result.error ?? "Erreur lors de la mise à jour.");
      }
      setPendingId(null);
    });
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12">
        <p className="text-sm text-gray400">Aucune action de comité ne vous est assignée.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-xs text-error">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray200">
              <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Action</th>
              <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Comité · Réunion</th>
              <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Échéance</th>
              <th className="px-5 py-3 text-center text-[10px] font-medium uppercase tracking-widest text-gray500">Statut</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => {
              const status = getStatus(action);
              const overdue = isOverdue(action.dueDate, status);
              const isPending = pendingId === action.id;

              return (
                <tr
                  key={action.id}
                  className="border-b border-gray200 last:border-0 hover:bg-gray50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-medium ${
                        status === "DONE" ? "text-gray400 line-through" : "text-facamBlack"
                      }`}
                    >
                      {action.title}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-facamDark">{action.committeeName}</span>
                    <span className="block text-[10px] text-gray400 mt-0.5">
                      Réunion du {formatDate(action.meetingDate)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-medium ${
                        overdue ? "text-error" : "text-gray500"
                      }`}
                    >
                      {formatDate(action.dueDate)}
                      {overdue && <span className="ml-1 text-[10px]">(en retard)</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleToggle(action)}
                      disabled={isPending}
                      title={status === "DONE" ? "Marquer comme en cours" : "Marquer comme terminé"}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50
                        hover:bg-gray100"
                    >
                      {isPending ? (
                        <Loader2 size={13} className="animate-spin text-gray400" />
                      ) : status === "DONE" ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <Circle size={14} className="text-gray400" />
                      )}
                      <span className={status === "DONE" ? "text-success" : "text-gray500"}>
                        {status === "DONE" ? "Terminé" : "En cours"}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
