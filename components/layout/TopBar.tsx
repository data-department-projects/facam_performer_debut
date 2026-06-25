import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

type Props = {
  pageTitle: string;
  userName: string;
  userRole: string;
};

export function TopBar({ pageTitle, userName, userRole }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray200 bg-facamWhite pl-14 pr-6 lg:pl-6">
      <h1 className="text-base font-semibold text-facamDark">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        {/* Notifications (placeholder Phase 6) */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray500 hover:bg-gray50 hover:text-facamBlue"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* Profil */}
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none text-facamBlack">
              {userName}
            </p>
            <p className="mt-0.5 text-xs text-gray500">{userRole}</p>
          </div>
        </Link>

        {/* Déconnexion */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray500 hover:bg-gray50 hover:text-error"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
