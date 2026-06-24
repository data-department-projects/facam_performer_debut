import { FolderOpen, CalendarCheck, Users, Target } from "lucide-react";
import type { ActivityItem } from "./types";

const typeConfig: Record<
  ActivityItem["type"],
  { icon: React.ElementType; bg: string; color: string }
> = {
  project: { icon: FolderOpen, bg: "bg-facamBlueTint", color: "text-facamBlue" },
  "week-planner": { icon: CalendarCheck, bg: "bg-successLight", color: "text-success" },
  committee: { icon: Users, bg: "bg-[#fef9ec]", color: "text-[#92600a]" },
  objective: { icon: Target, bg: "bg-gray100", color: "text-gray600" },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-4 text-base font-semibold text-facamDark">Activité récente</p>
        <p className="text-sm text-gray400">Aucune activité récente à afficher.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm">
      <p className="mb-4 text-base font-semibold text-facamDark">Activité récente</p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const { icon: Icon, bg, color } = typeConfig[item.type];
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-facamBlack">
                  {item.description}
                </p>
                <p className="text-xs text-gray500">
                  {item.actor} · {formatRelative(item.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
