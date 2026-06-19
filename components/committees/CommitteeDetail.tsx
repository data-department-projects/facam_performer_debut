"use client";

import { useState } from "react";
import { Calendar, Plus, TrendingUp, Users } from "lucide-react";
import { CommitteeMeetingCard } from "@/components/committees/CommitteeMeetingCard";
import { CommitteeMeetingFormModal } from "@/components/committees/CommitteeMeetingFormModal";
import { CommitteeActionFormModal } from "@/components/committees/CommitteeActionFormModal";
import type { MockCommittee } from "@/app/committees/_mock-data";

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
  committee: MockCommittee;
  canManage: boolean;
};

export function CommitteeDetail({ committee, canManage }: Props) {
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ open: boolean; meetingId: string | null }>({
    open: false,
    meetingId: null,
  });

  const taux = getTauxRealisation(committee);
  const allMembers = [...committee.participants, ...committee.guests];

  const sortedMeetings = [...committee.meetings].sort((a, b) =>
    b.meetingDate.localeCompare(a.meetingDate),
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Informations du comité ── */}
        <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold text-facamDark">{committee.name}</h1>
                <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-medium text-facamBlue">
                  {FREQUENCY_LABELS[committee.frequency]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray500">
                Responsable :{" "}
                <span className="font-medium text-facamBlack">{committee.responsible}</span>
              </p>
              {committee.departments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {committee.departments.map((dept) => (
                    <span
                      key={dept}
                      className="rounded-full bg-gray100 px-2 py-0.5 text-[10px] font-medium text-gray600"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Taux de réalisation */}
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-gray500 flex items-center gap-1">
                <TrendingUp size={12} />
                Taux de réalisation
              </p>
              <p className="text-3xl font-semibold text-facamDark">
                {taux !== null ? `${taux}%` : "—"}
              </p>
              {taux !== null && (
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray200">
                  <div
                    className={`h-full rounded-full ${
                      taux >= 75 ? "bg-success" : taux >= 40 ? "bg-facamBlue" : "bg-facamYellow"
                    }`}
                    style={{ width: `${taux}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Objectifs */}
          <p className="mt-4 border-t border-gray200 pt-4 text-sm text-facamBlack">
            {committee.objectives}
          </p>
        </div>

        {/* ── Membres ── */}
        <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-facamDark">
            <Users size={16} className="text-facamBlue" />
            Membres
            <span className="ml-1 rounded-full bg-gray100 px-2 py-0.5 text-xs font-medium text-gray600">
              {allMembers.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Participants */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray500">
                Participants ({committee.participants.length})
              </p>
              {committee.participants.length === 0 ? (
                <p className="text-xs text-gray400">Aucun participant.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {committee.participants.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-facamDark">{member.name}</p>
                        <p className="truncate text-xs text-gray500">{member.role}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-medium text-facamBlue">
                        Participant
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invités */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray500">
                Invités ({committee.guests.length})
              </p>
              {committee.guests.length === 0 ? (
                <p className="text-xs text-gray400">Aucun invité.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {committee.guests.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray200 text-xs font-semibold text-gray600">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-facamDark">{member.name}</p>
                        <p className="truncate text-xs text-gray500">{member.role}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-gray100 px-2 py-0.5 text-[10px] font-medium text-gray600">
                        Invité
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Réunions ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-facamDark">
              <Calendar size={16} className="text-facamBlue" />
              Réunions
              <span className="ml-1 rounded-full bg-gray100 px-2 py-0.5 text-xs font-medium text-gray600">
                {committee.meetings.length}
              </span>
            </h2>
            {canManage && (
              <button
                onClick={() => setMeetingModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
              >
                <Plus size={14} />
                Planifier une réunion
              </button>
            )}
          </div>

          {sortedMeetings.length === 0 ? (
            <div className="rounded-xl border border-gray200 bg-facamWhite p-10 text-center shadow-sm">
              <Calendar size={32} className="mx-auto mb-3 text-gray300" />
              <p className="text-sm text-gray400">Aucune réunion planifiée pour ce comité.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedMeetings.map((meeting) => (
                <CommitteeMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  canManage={canManage}
                  onAddAction={(meetingId) => setActionModal({ open: true, meetingId })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <CommitteeMeetingFormModal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
      />
      <CommitteeActionFormModal
        open={actionModal.open}
        members={allMembers}
        onClose={() => setActionModal({ open: false, meetingId: null })}
      />
    </>
  );
}
