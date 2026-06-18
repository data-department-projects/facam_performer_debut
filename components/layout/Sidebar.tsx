import Image from "next/image";
import { signOut } from "@/lib/auth";
import { SidebarNav, type NavItem } from "@/components/layout/SidebarNav";
import type { Role } from "@/app/generated/prisma/client";

const ADMIN_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", iconName: "LayoutDashboard" },
  { label: "Organigramme", href: "/org-chart", iconName: "GitBranch" },
  { label: "Projets & Comités", href: "/projects", iconName: "FolderKanban" },
  { label: "Suivi ETP & Temps", href: "/etp-tracking", iconName: "Clock" },
  { label: "Objectifs dép.", href: "/department-objectives", iconName: "Building2" },
  { label: "Administration", href: "/admin", iconName: "Users" },
  { label: "Actions à traiter", href: "/actions-to-process", iconName: "CheckSquare" },
  { label: "Guide / Bugs", href: "/help", iconName: "HelpCircle" },
];

const MANAGER_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", iconName: "LayoutDashboard" },
  { label: "Organigramme", href: "/org-chart", iconName: "GitBranch" },
  { label: "Projets & Comités", href: "/projects", iconName: "FolderKanban" },
  { label: "Week Planner", href: "/week-planner", iconName: "CalendarDays" },
  { label: "Objectifs", href: "/objectives", iconName: "Target" },
  { label: "Actions à traiter", href: "/actions-to-process", iconName: "CheckSquare" },
  { label: "Guide / Bugs", href: "/help", iconName: "HelpCircle" },
];

const COLLABORATOR_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", iconName: "LayoutDashboard" },
  { label: "Week Planner", href: "/week-planner", iconName: "CalendarDays" },
  { label: "Objectifs", href: "/objectives", iconName: "Target" },
  { label: "Mes Projets", href: "/projects", iconName: "FolderKanban" },
  { label: "Mes Comités", href: "/committees", iconName: "Building2" },
  { label: "Guide / Bugs", href: "/help", iconName: "HelpCircle" },
];

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_NAV;
    case "MANAGER":
      return MANAGER_NAV;
    case "COLLABORATOR":
      return COLLABORATOR_NAV;
  }
}

type Props = {
  role: Role;
  userName: string;
};

export function Sidebar({ role, userName }: Props) {
  const navItems = getNavItems(role);
  const roleLabel =
    role === "ADMIN"
      ? "Administrateur"
      : role === "MANAGER"
        ? "Manager"
        : "Collaborateur";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-facamBlue">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-white/10 px-5 py-4">
        <Image
          src="/facam_stairway-blanc.svg"
          alt="FACAM STAIRWAY"
          width={148}
          height={102}
          className="w-[148px] h-auto"
          priority
        />
      </div>

      {/* Navigation — filtrée par rôle côté serveur */}
      <nav className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={navItems} />
      </nav>

      {/* Pied de sidebar : utilisateur + déconnexion */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium leading-none text-facamWhite">
                {userName}
              </p>
              <p className="mt-0.5 text-[10px] text-facamYellow">{roleLabel}</p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-white/40 hover:text-error"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
