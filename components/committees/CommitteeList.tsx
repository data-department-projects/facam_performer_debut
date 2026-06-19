"use client";

import Link from "next/link";
import { Plus, Users, Calendar, TrendingUp } from "lucide-react";
import type { MockCommittee } from "@/app/committees/_mock-data";

export type { MockCommittee };

const FREQUENCY_LABELS: Record<MockCommittee["frequency"], string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  AD_HOC: "Ponctuel",
};

function getTauxRealisation(committee: MockCommittee): number | null {
  const allActions = committee.meetings.flatMap((m) => m.actions);
  if (allActions.length === 0) return null;
  const done = allActions.filter((a) => a.status === "DONE").length;
  return Math.round((done / allActions.length) * 100);
}

type Props = {
  committees: MockCommittee[];
  canCreate: boolean;
};

export function CommitteeList({ committees, canCreate }: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Tous les comités</h2>
          <p className="mt-0.5 text-xs text-gray500">
            {committees.length} comité{committees.length > 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/committees/new"
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
          >
            <Plus size={16} />
            Nouveau comité
          </Link>
        )}
      </div>

      {/* Liste */}
      {committees.length === 0 ? (
        <div className="rounded-xl border border-gray200 bg-facamWhite p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <Users size={36} className="text-gray300" />
            <p className="text-sm text-gray400">Aucun comité pour le moment.</p>
            {canCreate && (
              <Link
                href="/committees/new"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
              >
                <Plus size={14} />
                Créer un comité
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {committees.map((committee) => {
            const taux = getTauxRealisation(committee);
            const totalMembers = committee.participants.length + committee.guests.length;
            const nextMeeting = committee.meetings
              .filter((m) => m.meetingDate >= today)
              .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))[0];

            return (
              <Link
                key={committee.id}
                href={`/committees/${committee.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm hover:border-facamBlue hover:shadow-md transition-all"
              >
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-facamDark group-hover:text-facamBlue transition-colors">
                      {committee.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-gray500">{committee.responsible}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-medium text-facamBlue">
                    {FREQUENCY_LABELS[committee.frequency]}
                  </span>
                </div>

                {/* Objectifs */}
                <p className="line-clamp-2 text-xs text-gray500">{committee.objectives}</p>

                {/* Métadonnées */}
                <div className="flex items-center gap-4 text-xs text-gray500">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {totalMembers} membre{totalMembers > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {committee.meetings.length} réunion{committee.meetings.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Prochaine réunion */}
                {nextMeeting ? (
                  <div className="rounded-md bg-facamBlueTint px-3 py-2 text-xs text-facamBlue">
                    Prochaine réunion :{" "}
                    <span className="font-medium">
                      {new Date(nextMeeting.meetingDate + "T00:00:00").toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                      })}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-md bg-gray100 px-3 py-2 text-xs text-gray500">
                    Aucune réunion planifiée
                  </div>
                )}

                {/* Taux de réalisation */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-gray500">
                      <TrendingUp size={12} />
                      Taux de réalisation
                    </span>
                    <span className="text-xs font-semibold text-facamDark">
                      {taux !== null ? `${taux}%` : "—"}
                    </span>
                  </div>
                  {taux !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          taux >= 75
                            ? "bg-success"
                            : taux >= 40
                              ? "bg-facamBlue"
                              : "bg-facamYellow"
                        }`}
                        style={{ width: `${taux}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
