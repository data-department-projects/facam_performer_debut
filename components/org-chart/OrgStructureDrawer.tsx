"use client";

import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import { OrgTree } from "@/components/org-chart/OrgTree";
import type { OrgDeptNode } from "@/app/org-chart/page";

type Props = {
  deptTree: OrgDeptNode[];
  allDepts: { id: string; name: string; parentDepartmentId: string | null }[];
  allUsers: { id: string; fullName: string; role: string }[];
};

export function OrgStructureDrawer({ deptTree, allDepts, allUsers }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray200 bg-facamWhite px-4 py-2 text-sm font-semibold text-facamDark shadow-sm transition-colors hover:bg-gray50"
      >
        <Settings size={15} className="text-facamBlue" />
        Gérer la structure
      </button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-facamDark/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-facamWhite shadow-2xl transition-transform duration-300 ease-in-out sm:w-[680px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header du drawer */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray100 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray400">
              Administration
            </p>
            <h2 className="text-base font-bold text-facamDark">Structure de l&apos;organisation</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="rounded-lg p-2 text-gray400 transition-colors hover:bg-gray100 hover:text-facamDark"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <OrgTree
            deptTree={deptTree}
            allDepts={allDepts}
            allUsers={allUsers}
            isAdmin={true}
          />
        </div>
      </aside>
    </>
  );
}
