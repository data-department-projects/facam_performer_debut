"use client";

import { FileText, FileDown } from "lucide-react";

type Props = { period: "week" | "month" | "quarter" };

export function EtpExportButtons({ period }: Props) {
  return (
    <div className="flex gap-3">
      <a
        href={`/api/reports/etp?period=${period}`}
        className="flex items-center gap-2 rounded-lg border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark transition-colors hover:bg-gray50"
      >
        <FileText size={15} className="text-gray400" />
        Exporter en PDF
      </a>
      <a
        href={`/api/reports/etp/csv?period=${period}`}
        className="flex items-center gap-2 rounded-lg border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark transition-colors hover:bg-gray50"
      >
        <FileDown size={15} className="text-gray400" />
        Exporter en CSV
      </a>
    </div>
  );
}
