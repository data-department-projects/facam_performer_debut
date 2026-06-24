"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { SidebarNav, type NavItem } from "@/components/layout/SidebarNav";

type Props = {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
};

export function MobileNav({ navItems, userName, roleLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger trigger — top-left, mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir le menu"
        className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-facamBlue text-facamWhite shadow-md lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-60 flex h-full w-[260px] flex-col bg-facamBlue shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Image
            src="/facam_stairway-blanc.svg"
            alt="FACAM STAIRWAY"
            width={120}
            height={83}
            className="h-auto w-[120px]"
          />
          <button
            onClick={close}
            aria-label="Fermer le menu"
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation — close drawer on link click */}
        <nav className="flex-1 overflow-y-auto py-4" onClick={close}>
          <SidebarNav items={navItems} />
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-facamBlueMid text-xs font-semibold text-facamWhite">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-facamWhite">{userName}</p>
              <p className="mt-0.5 text-[10px] text-facamYellow">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
