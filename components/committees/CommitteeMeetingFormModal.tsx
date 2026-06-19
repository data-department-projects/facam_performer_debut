"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { planMeeting } from "@/actions/committees";

type Props = {
  open: boolean;
  committeeId: string;
  onClose: () => void;
};

export function CommitteeMeetingFormModal({ open, committeeId, onClose }: Props) {
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleClose() {
    setMeetingDate("");
    setStartTime("");
    setEndTime("");
    setMeetingLink("");
    setError(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await planMeeting({
        committeeId,
        meetingDate,
        startTime,
        endTime,
        meetingLink: meetingLink || undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      handleClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">Planifier une réunion</h3>
          <button onClick={handleClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meeting-date" className="text-sm font-medium text-facamBlack">
              Date de la réunion
            </label>
            <input
              id="meeting-date"
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="start-time" className="text-sm font-medium text-facamBlack">
                Heure de début
              </label>
              <input
                id="start-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="end-time" className="text-sm font-medium text-facamBlack">
                Heure de fin
              </label>
              <input
                id="end-time"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
          </div>

          {/* Lien de connexion */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meeting-link" className="text-sm font-medium text-facamBlack">
              Lien de connexion{" "}
              <span className="text-xs font-normal text-gray400">(optionnel)</span>
            </label>
            <input
              id="meeting-link"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Erreur */}
          {error && (
            <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !meetingDate || !startTime || !endTime}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Planifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
