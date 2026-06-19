"use client";

import { CheckCircle2, Clock } from "lucide-react";
import type { MockAction } from "@/app/committees/_mock-data";

type Props = {
  actions: MockAction[];
};

export function CommitteeActionsList({ actions }: Props) {
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
                action.status === "DONE"
                  ? "text-gray500 line-through"
                  : "text-facamBlack"
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

          {/* Badge statut */}
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              action.status === "DONE"
                ? "bg-successLight text-success"
                : "bg-warningLight text-warning"
            }`}
          >
            {action.status === "DONE" ? "Réalisée" : "En attente"}
          </span>
        </div>
      ))}
    </div>
  );
}
