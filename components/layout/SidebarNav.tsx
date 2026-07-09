"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  FolderKanban,
  Target,
  Users,
  CheckSquare,
  HelpCircle,
  CalendarDays,
  Building2,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  GitBranch,
  FolderKanban,
  Target,
  Users,
  CheckSquare,
  HelpCircle,
  CalendarDays,
  Building2,
};

export type NavItem = {
  label: string;
  href: string;
  iconName: string;
};

type Props = {
  items: NavItem[];
  actionsToProcessCount?: number;
};

export function SidebarNav({ items, actionsToProcessCount = 0 }: Readonly<Props>) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = ICONS[item.iconName];
        const showBadge = item.href === "/actions-to-process" && actionsToProcessCount > 0;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-l-[3px] border-facamYellow bg-facamBlueMid pl-[9px] text-facamWhite"
                  : "text-white/70 hover:bg-white/10 hover:text-facamWhite"
              }`}
            >
              {Icon && <Icon size={18} className="flex-shrink-0" />}
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-facamWhite">
                  {actionsToProcessCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
