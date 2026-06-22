import { CalendarDays, Video, Clock } from "lucide-react";

export type MyCommittee = {
  id: string;
  name: string;
  objectives: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC";
  nextMeeting: {
    meetingDate: string;
    startTime: string;
    endTime: string;
    meetingLink: string | null;
  } | null;
};

const FREQUENCY_LABELS: Record<MyCommittee["frequency"], string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  AD_HOC: "Ad hoc",
};

const FREQUENCY_COLORS: Record<MyCommittee["frequency"], string> = {
  WEEKLY: "bg-facamBlueTint text-facamBlue",
  MONTHLY: "bg-successLight text-success",
  QUARTERLY: "bg-warningLight text-warning",
  ANNUAL: "bg-errorLight text-error",
  AD_HOC: "bg-gray100 text-gray600",
};

type Props = { committee: MyCommittee };

export function MyCommitteeCard({ committee }: Props) {
  const { name, objectives, frequency, nextMeeting } = committee;

  const formattedDate = nextMeeting
    ? new Date(nextMeeting.meetingDate + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray200 bg-facamWhite p-5 shadow-sm">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-facamDark leading-snug">{name}</h3>
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${FREQUENCY_COLORS[frequency]}`}
        >
          {FREQUENCY_LABELS[frequency]}
        </span>
      </div>

      {/* Objectifs */}
      <p className="text-xs text-gray500 line-clamp-2 leading-relaxed">{objectives}</p>

      {/* Prochaine réunion */}
      <div className="mt-auto border-t border-gray100 pt-3">
        {nextMeeting ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-facamDark">
              <CalendarDays size={13} className="text-facamBlue flex-shrink-0" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray500">
              <Clock size={12} className="flex-shrink-0" />
              {nextMeeting.startTime} – {nextMeeting.endTime}
            </div>
            {nextMeeting.meetingLink && (
              <a
                href={nextMeeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-facamBlue hover:underline"
              >
                <Video size={12} className="flex-shrink-0" />
                Rejoindre la réunion
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray400 italic">Aucune réunion planifiée</p>
        )}
      </div>
    </div>
  );
}
