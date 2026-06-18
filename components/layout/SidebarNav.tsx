"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  FolderKanban,
  Clock,
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
  Clock,
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
};

export function SidebarNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = ICONS[item.iconName];

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
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
