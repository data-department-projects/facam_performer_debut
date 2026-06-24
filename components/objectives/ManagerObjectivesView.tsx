"use client";

import { useState } from "react";
import type { ObjectiveWithKeyResults } from "./types";
import { ObjectiveCard } from "./ObjectiveCard";
import { ObjectiveDrawer } from "./ObjectiveDrawer";

type Props = {
  teamObjectives: ObjectiveWithKeyResults[];
};

export function ManagerObjectivesView({ teamObjectives }: Props) {
  const [selectedObjective, setSelectedObjective] =
    useState<ObjectiveWithKeyResults | null>(null);

  const byUser = teamObjectives.reduce<
    Record<string, { userName: string; objectives: ObjectiveWithKeyResults[] }>
  >((acc, obj) => {
    if (!acc[obj.userId]) {
      acc[obj.userId] = { userName: obj.userName, objectives: [] };
    }
    acc[obj.userId].objectives.push(obj);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-facamDark">
          Objectifs de mon équipe
        </h1>
        <p className="text-sm text-gray500">
          {teamObjectives.length} objectif
          {teamObjectives.length > 1 ? "s" : ""} — lecture seule
        </p>
      </div>

      {teamObjectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <p className="text-sm font-medium text-gray500">
            Aucun objectif dans votre département pour l&apos;instant.
          </p>
        </div>
      ) : (
        Object.entries(byUser).map(([userId, { userName, objectives }]) => (
          <div key={userId}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueTint text-xs font-semibold text-facamBlue">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <h2 className="text-sm font-semibold text-facamDark">{userName}</h2>
              <span className="text-xs text-gray400">
                {objectives.length} objectif{objectives.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {objectives.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  objective={obj}
                  onSelect={() => setSelectedObjective(obj)}
                  readonly
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Drawer — lecture seule */}
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
