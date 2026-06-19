"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { MockAction } from "@/app/committees/_mock-data";
import { updateCommitteeActionStatus } from "@/actions/committees";
import type { CommitteeActionStatus } from "@/app/generated/prisma/client";

type Props = {
  actions: MockAction[];
  canManage: boolean;
};

export function CommitteeActionsList({ actions, canManage }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggle(actionId: string, current: "PENDING" | "DONE") {
    setPendingId(actionId);
    const next: CommitteeActionStatus = current === "DONE" ? "PENDING" : "DONE";
    await updateCommitteeActionStatus(actionId, next);
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
    <div className="flex flex-col divide-y divide-gray200">
      {actions.map((action) => (
        <div key={action.id} className="flex items-start gap-3 py-3">
          {/* Statut icône */}
          <div className="mt-0.5 flex-shrink-0">
            {action.status === "DONE" ? (
              <CheckCircle2 size={15} className="text-success" />
            ) : (
              <Clock size={15} className="text-warning" />
            )}
          </div>

          {/* Contenu */}
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium ${
                action.status === "DONE" ? "text-gray500 line-through" : "text-facamBlack"
              }`}
            >
              {action.title}
            </p>
            <p className="mt-0.5 text-xs text-gray400">
              {action.responsible} · Échéance{" "}
              {new Date(action.dueDate + "T00:00:00").toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Badge / Toggle statut */}
          {canManage ? (
            <button
              onClick={() => handleToggle(action.id, action.status)}
              disabled={pendingId === action.id}
              className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-75 disabled:opacity-50 ${
                action.status === "DONE"
                  ? "bg-successLight text-success"
                  : "bg-warningLight text-warning"
              }`}
            >
              {pendingId === action.id && <Loader2 size={10} className="animate-spin" />}
              {action.status === "DONE" ? "Réalisée" : "En attente"}
            </button>
          ) : (
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                action.status === "DONE"
                  ? "bg-successLight text-success"
                  : "bg-warningLight text-warning"
              }`}
            >
              {action.status === "DONE" ? "Réalisée" : "En attente"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
