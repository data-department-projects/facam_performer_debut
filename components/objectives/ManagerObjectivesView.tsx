"use client";

import { useState } from "react";
import { Users, Eye } from "lucide-react";
import type { ObjectiveWithKeyResults } from "./types";
import { ObjectiveDrawer } from "./ObjectiveDrawer";
import { ObjectiveTypeBadge } from "./ObjectiveStatusBadge";

type Props = {
  teamObjectives: ObjectiveWithKeyResults[];
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function ManagerObjectivesView({ teamObjectives }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithKeyResults | null>(null);

  // Liste dédupliquée des collaborateurs
  const collaborators = Array.from(
    new Map(teamObjectives.map((o) => [o.userId, o.userName])).entries(),
  ).map(([id, name]) => ({ id, name }));

  const filtered = selectedUserId
    ? teamObjectives.filter((o) => o.userId === selectedUserId)
    : teamObjectives;

  const selectedUserName = collaborators.find((c) => c.id === selectedUserId)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* En-tête + filtre collaborateur */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-facamDark">Objectifs de mon équipe</h1>
          <p className="text-sm text-gray500">
            {filtered.length} objectif{filtered.length !== 1 ? "s" : ""}
            {" · "}
            {selectedUserName ?? "tous les collaborateurs"}
          </p>
        </div>

        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="rounded-lg border border-gray200 bg-facamWhite px-3 py-1.5 text-sm text-facamDark focus:border-facamBlue focus:outline-none"
        >
          <option value="">Tous les collaborateurs</option>
          {collaborators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau ou empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <Users size={32} className="mb-3 text-gray300" />
          <p className="text-sm font-medium text-gray500">
            {selectedUserId
              ? "Aucun objectif pour ce collaborateur."
              : "Aucun objectif dans votre département pour l'instant."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray200 bg-facamWhite">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-gray100 bg-gray50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Collaborateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Objectif
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Période
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Résultats clés
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray100">
              {filtered.map((obj) => {
                const totalKRs = obj.keyResults.length;
                const doneKRs = obj.keyResults.filter((kr) => kr.status === "DONE").length;
                const pct = totalKRs > 0 ? Math.round((doneKRs / totalKRs) * 100) : 0;

                return (
                  <tr
                    key={obj.id}
                    className="cursor-pointer transition-colors hover:bg-facamBlueTint/30"
                    onClick={() => setSelectedObjective(obj)}
                  >
                    <td className="px-4 py-3 font-medium text-facamDark">{obj.userName}</td>
                    <td className="max-w-[240px] px-4 py-3">
                      <span className="block truncate text-facamDark" title={obj.name}>
                        {obj.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ObjectiveTypeBadge type={obj.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray500">
                      {formatDate(obj.periodStart)} → {formatDate(obj.periodEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray200">
                          <div
                            className={`h-full rounded-full ${
                              pct === 100
                                ? "bg-success"
                                : pct >= 30
                                  ? "bg-facamBlue"
                                  : "bg-warning"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray500">{doneKRs}/{totalKRs}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjective(obj);
                        }}
                        className="rounded-lg p-1.5 text-gray400 transition-colors hover:bg-facamBlueTint hover:text-facamBlue"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedObjective && (
        <ObjectiveDrawer
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
          onUpdateKR={() => {}}
          onAddKR={() => {}}
          readonly
        />
      )}
    </div>
  );
}
