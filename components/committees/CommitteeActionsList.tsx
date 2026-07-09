"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { MockAction } from "@/app/committees/_mock-data";
import { updateCommitteeActionStatus } from "@/actions/committees";
import { isCommitteeActionOverdue } from "@/lib/overdue";
import type { CommitteeActionStatus } from "@/app/generated/prisma/client";

type Props = {
  actions: MockAction[];
  canManage: boolean;
};

type ActionRowProps = {
  action: MockAction;
  canManage: boolean;
  pendingId: string | null;
  onToggle: (actionId: string, current: "PENDING" | "DONE") => void;
};

function ActionRow({ action, canManage, pendingId, onToggle }: Readonly<ActionRowProps>) {
  const overdue = isCommitteeActionOverdue(action);
  const isDone = action.status === "DONE";
  const isPending = pendingId === action.id;

  const pendingLabel = overdue ? "En retard" : "En attente";
  const statusLabel = isDone ? "Réalisée" : pendingLabel;

  const pendingBadgeClass = overdue ? "bg-errorLight text-error" : "bg-warningLight text-warning";
  const badgeClass = isDone ? "bg-successLight text-success" : pendingBadgeClass;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Statut icône */}
      <div className="mt-0.5 flex-shrink-0">
        {isDone ? (
          <CheckCircle2 size={15} className="text-success" />
        ) : (
          <Clock size={15} className={overdue ? "text-error" : "text-warning"} />
        )}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            isDone ? "text-gray500 line-through" : "text-facamBlack"
          }`}
        >
          {action.title}
        </p>
        <p className={`mt-0.5 text-xs ${overdue ? "font-medium text-error" : "text-gray400"}`}>
          {action.responsible} · Échéance{" "}
          {new Date(action.dueDate + "T00:00:00").toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {overdue ? " — en retard" : ""}
        </p>
      </div>

      {/* Badge / Toggle statut */}
      {canManage ? (
        <button
          onClick={() => onToggle(action.id, action.status)}
          disabled={isPending}
          className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-75 disabled:opacity-50 ${badgeClass}`}
        >
          {isPending && <Loader2 size={10} className="animate-spin" />}
          {statusLabel}
        </button>
      ) : (
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}

export function CommitteeActionsList({ actions, canManage }: Readonly<Props>) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleToggle(actionId: string, current: "PENDING" | "DONE") {
    setPendingId(actionId);
    setToggleError(null);
    const next: CommitteeActionStatus = current === "DONE" ? "PENDING" : "DONE";
    const result = await updateCommitteeActionStatus(actionId, next);
    if (!result.success) {
      setToggleError(result.error ?? "Erreur lors de la mise à jour.");
    }
    setPendingId(null);
  }

  if (actions.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-gray400">
        Aucune décision enregistrée pour cette réunion.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {toggleError && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-xs text-error">{toggleError}</p>
      )}
      <div className="flex flex-col divide-y divide-gray200">
        {actions.map((action) => (
          <ActionRow
            key={action.id}
            action={action}
            canManage={canManage}
            pendingId={pendingId}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
