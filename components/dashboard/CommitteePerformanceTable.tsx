import Link from "next/link";
import { Users, CalendarClock, AlertCircle } from "lucide-react";
import type { CommitteeRow } from "./types";

function CompletionBar({ rate }: { rate: number }) {
  const color =
    rate >= 75 ? "bg-success" : rate >= 50 ? "bg-facamYellow" : "bg-error";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span
        className={`text-xs font-semibold ${rate >= 75 ? "text-success" : rate >= 50 ? "text-warning" : "text-error"}`}
      >
        {rate}%
      </span>
    </div>
  );
}

export function CommitteePerformanceTable({ rows }: { rows: CommitteeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-4 text-base font-semibold text-facamDark">Performance des comités</p>
        <p className="text-sm text-gray400">Aucun comité configuré.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray100 px-5 py-4">
        <Users className="h-4 w-4 text-facamBlue" />
        <p className="text-base font-semibold text-facamDark">Performance des comités</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray100">
              {["Comité", "Fréquence", "Décisions", "En retard", "Réalisation", "Prochaine réunion"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray500 last:pr-5"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray100 last:border-0 hover:bg-gray50"
              >
                <td className="px-5 py-3">
                  <Link
                    href="/committees"
                    className="font-medium text-facamBlue hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray500">{row.frequency}</td>
                <td className="px-5 py-3 text-center">
                  <span className="font-medium text-facamDark">{row.doneActions}</span>
                  <span className="text-gray400"> / {row.totalActions}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  {row.overdueActions > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-error font-medium">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {row.overdueActions}
                    </span>
                  ) : (
                    <span className="text-gray400">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <CompletionBar rate={row.completionRate} />
                </td>
                <td className="px-5 py-3">
                  {row.nextMeetingDate ? (
                    <span className="flex items-center gap-1.5 text-xs text-gray600">
                      <CalendarClock className="h-3.5 w-3.5 text-facamBlue" />
                      {row.nextMeetingDate}
                    </span>
                  ) : (
                    <span className="text-xs text-gray400">Non planifiée</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
