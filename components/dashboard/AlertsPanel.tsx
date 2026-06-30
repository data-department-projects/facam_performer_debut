import Link from "next/link";
import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import type { AlertItem, AlertSeverity } from "./types";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { icon: React.ElementType; bg: string; iconColor: string; border: string; label: string }
> = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-errorLight",
    iconColor: "text-error",
    border: "border-l-error",
    label: "Critique",
  },
  high: {
    icon: AlertCircle,
    bg: "bg-[#fff7ed]",
    iconColor: "text-[#c2410c]",
    border: "border-l-[#c2410c]",
    label: "Élevé",
  },
  medium: {
    icon: AlertCircle,
    bg: "bg-warningLight",
    iconColor: "text-warning",
    border: "border-l-facamYellow",
    label: "Modéré",
  },
  info: {
    icon: Info,
    bg: "bg-facamBlueTint",
    iconColor: "text-facamBlue",
    border: "border-l-facamBlue",
    label: "Info",
  },
};

function AlertRow({ alert }: { alert: AlertItem }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg border border-gray100 border-l-2 ${config.border} ${config.bg} px-3 py-2.5 transition-colors ${alert.href ? "hover:brightness-95" : ""}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
      <p className="flex-1 text-sm text-facamBlack leading-snug">{alert.message}</p>
      {alert.href && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray400" />}
    </div>
  );

  if (alert.href) {
    return <Link href={alert.href}>{content}</Link>;
  }
  return content;
}

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const hasAlerts = alerts.length > 0;

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      <div className="flex items-center justify-between border-b border-gray100 px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <p className="text-base font-semibold text-facamDark">Alertes actives</p>
        </div>
        {criticalCount > 0 && (
          <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-facamWhite">
            {criticalCount} critique{criticalCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-4">
        {!hasAlerts ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-successLight">
              <Info className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm font-medium text-success">Aucune alerte active</p>
            <p className="text-xs text-gray400">Tout est nominal sur votre périmètre.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <AlertRow alert={alert} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
