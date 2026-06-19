"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Link2, Plus } from "lucide-react";
import { CommitteeActionsList } from "@/components/committees/CommitteeActionsList";
import type { MockMeeting } from "@/app/committees/_mock-data";

type Props = {
  meeting: MockMeeting;
  canManage: boolean;
  onAddAction: (meetingId: string) => void;
};

function getMeetingStatus(meetingDate: string): "past" | "today" | "upcoming" {
  const today = new Date().toISOString().split("T")[0];
  if (meetingDate < today) return "past";
  if (meetingDate === today) return "today";
  return "upcoming";
}

const STATUS_CONFIG = {
  past: { label: "Passée", className: "bg-gray100 text-gray500" },
  today: { label: "Aujourd'hui", className: "bg-facamBlueTint text-facamBlue" },
  upcoming: { label: "À venir", className: "bg-successLight text-success" },
};

export function CommitteeMeetingCard({ meeting, canManage, onAddAction }: Props) {
  const [expanded, setExpanded] = useState(false);

  const status = getMeetingStatus(meeting.meetingDate);
  const statusConfig = STATUS_CONFIG[status];

  const formattedDate = new Date(meeting.meetingDate + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      {/* En-tête de la réunion */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray50 transition-colors"
      >
        {/* Chevron */}
        <span className="flex-shrink-0 text-gray400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>

        {/* Date */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold capitalize text-facamDark">{formattedDate}</p>
          <p className="mt-0.5 text-xs text-gray500">
            {meeting.startTime} – {meeting.endTime}
            {meeting.actions.length > 0 && (
              <span className="ml-2 text-gray400">
                · {meeting.actions.length} décision{meeting.actions.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Lien de connexion */}
        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 rounded-md bg-facamBlueTint p-1.5 text-facamBlue hover:bg-facamBlue hover:text-facamWhite transition-colors"
            title="Rejoindre la réunion"
          >
            <Link2 size={13} />
          </a>
        )}

        {/* Badge statut */}
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </button>

      {/* Corps expansible — actions */}
      {expanded && (
        <div className="border-t border-gray200 px-5 pb-4 pt-3">
          <CommitteeActionsList actions={meeting.actions} canManage={canManage} />

          {canManage && (
            <button
              onClick={() => onAddAction(meeting.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-facamBlue hover:text-facamDark transition-colors"
            >
              <Plus size={13} />
              Ajouter une décision
            </button>
          )}
        </div>
      )}
    </div>
  );
}
