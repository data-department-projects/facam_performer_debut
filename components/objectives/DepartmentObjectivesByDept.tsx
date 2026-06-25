"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Eye,
  Calendar,
  Target,
  BarChart2,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import type { DepartmentGroup, ObjectiveWithKeyResults } from "./types";
import { ObjectiveDrawer } from "./ObjectiveDrawer";
import { ObjectiveTypeBadge } from "./ObjectiveStatusBadge";

type FlatObjective = ObjectiveWithKeyResults & { deptId: string; deptName: string };

type Props = {
  groups: DepartmentGroup[];
  adminName?: string;
};

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function AdminGreetingBanner({ adminName }: { adminName: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const dayName = DAYS_FR[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-facamBlue to-facamDark px-7 py-6">
      {/* Cercles décoratifs de fond */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 right-16 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-6 -right-2 h-28 w-28 rounded-full bg-white/5" />

      {/* Icônes flottantes — côté droit */}
      <div className="pointer-events-none absolute right-8 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-sm">
        <Target size={16} className="text-white" />
      </div>
      <div className="pointer-events-none absolute right-28 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
        <BarChart2 size={13} className="text-white/80" />
      </div>
      <div className="pointer-events-none absolute right-20 top-14 flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
        <TrendingUp size={14} className="text-white" />
      </div>
      <div className="pointer-events-none absolute right-6 bottom-10 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
        <Users size={14} className="text-white/80" />
      </div>
      <div className="pointer-events-none absolute right-28 bottom-6 flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
        <Award size={13} className="text-white" />
      </div>
      <div className="pointer-events-none absolute right-14 bottom-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
        <CheckCircle2 size={14} className="text-white/80" />
      </div>
      <div className="pointer-events-none absolute right-40 top-10 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
        <Briefcase size={13} className="text-white/70" />
      </div>
      <div className="pointer-events-none absolute right-44 bottom-8 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Building2 size={15} className="text-white/80" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col gap-2 max-w-[55%]">
        {/* Chip date/heure */}
        <div className="flex items-center gap-1.5 text-white/70 text-xs">
          <Calendar size={12} />
          <span suppressHydrationWarning>
            {dayName} {dateStr} &middot; {timeStr}
          </span>
        </div>

        {/* Salutation */}
        <h2 suppressHydrationWarning className="text-2xl font-bold text-white leading-tight">
          {greeting}, {adminName} !
        </h2>

        {/* Sous-titre */}
        <p className="text-sm text-white/70">
          Bonne journée de {dayName.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}

export function DepartmentObjectivesByDept({ groups, adminName }: Props) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithKeyResults | null>(null);

  const allObjectives: FlatObjective[] = groups.flatMap((g) =>
    g.objectives.map((obj) => ({ ...obj, deptId: g.id, deptName: g.name })),
  );

  const filtered = selectedDeptId
    ? allObjectives.filter((o) => o.deptId === selectedDeptId)
    : allObjectives;

  const selectedDeptName = groups.find((g) => g.id === selectedDeptId)?.name;

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau de bienvenue Admin */}
      {adminName && <AdminGreetingBanner adminName={adminName} />}

      {/* En-tête + filtre département */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-facamDark">Objectifs Départements</h1>
          <p className="text-sm text-gray500">
            {filtered.length} objectif{filtered.length !== 1 ? "s" : ""}
            {" · "}
            {selectedDeptName ?? "tous les départements"}
          </p>
        </div>

        <select
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
          className="rounded-lg border border-gray200 bg-facamWhite px-3 py-1.5 text-sm text-facamDark focus:border-facamBlue focus:outline-none"
        >
          <option value="">Tous les départements</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau ou empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <Building2 size={32} className="mb-3 text-gray300" />
          <p className="text-sm font-medium text-gray500">
            {selectedDeptId ? "Aucun objectif pour ce département." : "Aucun objectif enregistré."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray200 bg-facamWhite">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray100 bg-gray50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Collaborateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Département
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Objectif
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Période
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Résultats clés
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray100">
              {filtered.map((obj) => {
                const totalKRs = obj.keyResults.length;
                const doneKRs = obj.keyResults.filter((kr) => kr.status === "DONE").length;
                const pct = totalKRs > 0 ? Math.round((doneKRs / totalKRs) * 100) : 0;

                return (
                  <tr
                    key={obj.id}
                    className="cursor-pointer transition-colors hover:bg-facamBlueTint/30"
                    onClick={() => setSelectedObjective(obj)}
                  >
                    <td className="px-4 py-3 font-medium text-facamDark">{obj.userName}</td>
                    <td className="px-4 py-3 text-gray500">{obj.deptName}</td>
                    <td className="max-w-[220px] px-4 py-3">
                      <span className="block truncate text-facamDark" title={obj.name}>
                        {obj.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ObjectiveTypeBadge type={obj.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray500">
                      {formatDate(obj.periodStart)} → {formatDate(obj.periodEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray200">
                          <div
                            className={`h-full rounded-full ${
                              pct === 100
                                ? "bg-success"
                                : pct >= 30
                                  ? "bg-facamBlue"
                                  : "bg-warning"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray500">{doneKRs}/{totalKRs}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjective(obj);
                        }}
                        className="rounded-lg p-1.5 text-gray400 transition-colors hover:bg-facamBlueTint hover:text-facamBlue"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedObjective && (
        <ObjectiveDrawer
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
          onUpdateKR={() => undefined}
          onAddKR={() => undefined}
          readonly
        />
      )}
    </div>
  );
}
