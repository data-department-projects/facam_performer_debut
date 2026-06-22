"use client";

import { useState } from "react";
import type { EtpEntry } from "@/lib/dashboard-queries";

type Tab = "collaborateur" | "departement" | "activite";

const TABS: { key: Tab; label: string }[] = [
  { key: "collaborateur", label: "Par collaborateur" },
  { key: "departement", label: "Par département" },
  { key: "activite", label: "Par activité" },
];

function formatEtp(hours: number) {
  return (hours / 8).toFixed(1);
}

type Props = { entries: EtpEntry[] };

export function EtpConsolidationTable({ entries }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("collaborateur");

  // --- Par collaborateur ---
  const byCollaborateur = Object.values(
    entries.reduce<Record<string, { name: string; initials: string; department: string; team: string; hours: number }>>(
      (acc, e) => {
        if (!acc[e.collaboratorName]) {
          acc[e.collaboratorName] = { name: e.collaboratorName, initials: e.initials, department: e.department, team: e.team, hours: 0 };
        }
        acc[e.collaboratorName].hours += e.hoursSpent;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.hours - a.hours);

  // --- Par département ---
  const byDepartement = Object.values(
    entries.reduce<Record<string, { department: string; hours: number; collaborateurs: Set<string> }>>(
      (acc, e) => {
        if (!acc[e.department]) {
          acc[e.department] = { department: e.department, hours: 0, collaborateurs: new Set() };
        }
        acc[e.department].hours += e.hoursSpent;
        acc[e.department].collaborateurs.add(e.collaboratorName);
        return acc;
      },
      {},
    ),
  )
    .map((d) => ({ ...d, collabCount: d.collaborateurs.size }))
    .sort((a, b) => b.hours - a.hours);

  // --- Par activité ---
  const byActivite = Object.values(
    entries.reduce<Record<string, { label: string; hours: number; count: number }>>(
      (acc, e) => {
        if (!acc[e.activityLabel]) {
          acc[e.activityLabel] = { label: e.activityLabel, hours: 0, count: 0 };
        }
        acc[e.activityLabel].hours += e.hoursSpent;
        acc[e.activityLabel].count += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.hours - a.hours);

  const isEmpty = entries.length === 0;

  return (
    <div className="rounded-2xl border border-gray200 bg-facamWhite shadow-sm">
      {/* Onglets */}
      <div className="flex border-b border-gray200 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px mr-6 border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-facamBlue text-facamBlue"
                : "border-transparent text-gray500 hover:text-facamDark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isEmpty && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray400">Aucune déclaration de temps pour cette période</p>
        </div>
      )}

      {/* Tableau par collaborateur */}
      {!isEmpty && activeTab === "collaborateur" && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray500">Collaborateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray500">Département</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray500">Équipe</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">Heures déclarées</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">ETP consommé</th>
            </tr>
          </thead>
          <tbody>
            {byCollaborateur.map((row) => (
              <tr key={row.name} className="border-b border-gray200 hover:bg-gray50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-facamBlueTint text-xs font-semibold text-facamBlue">
                      {row.initials}
                    </div>
                    <span className="text-sm text-facamBlack">{row.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-facamBlack">{row.department}</td>
                <td className="px-6 py-3 text-sm text-facamBlack">{row.team}</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamDark">{row.hours.toFixed(1)} h</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamBlue">{formatEtp(row.hours)} j</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray50">
              <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-facamDark">Total</td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamDark">
                {byCollaborateur.reduce((s, r) => s + r.hours, 0).toFixed(1)} h
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamBlue">
                {formatEtp(byCollaborateur.reduce((s, r) => s + r.hours, 0))} j
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Tableau par département */}
      {!isEmpty && activeTab === "departement" && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray500">Département</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">Collaborateurs actifs</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">Heures déclarées</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">ETP consommé</th>
            </tr>
          </thead>
          <tbody>
            {byDepartement.map((row) => (
              <tr key={row.department} className="border-b border-gray200 hover:bg-gray50">
                <td className="px-6 py-3 text-sm font-medium text-facamBlack">{row.department}</td>
                <td className="px-6 py-3 text-right text-sm text-facamBlack">{row.collabCount}</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamDark">{row.hours.toFixed(1)} h</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamBlue">{formatEtp(row.hours)} j</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray50">
              <td className="px-6 py-3 text-sm font-semibold text-facamDark">Total</td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamDark">
                {new Set(entries.map((e) => e.collaboratorName)).size}
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamDark">
                {byDepartement.reduce((s, r) => s + r.hours, 0).toFixed(1)} h
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamBlue">
                {formatEtp(byDepartement.reduce((s, r) => s + r.hours, 0))} j
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Tableau par activité */}
      {!isEmpty && activeTab === "activite" && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray500">Activité</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">Occurrences</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">Heures déclarées</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray500">ETP consommé</th>
            </tr>
          </thead>
          <tbody>
            {byActivite.map((row) => (
              <tr key={row.label} className="border-b border-gray200 hover:bg-gray50">
                <td className="px-6 py-3 text-sm text-facamBlack">{row.label}</td>
                <td className="px-6 py-3 text-right text-sm text-facamBlack">{row.count}</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamDark">{row.hours.toFixed(1)} h</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-facamBlue">{formatEtp(row.hours)} j</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray50">
              <td className="px-6 py-3 text-sm font-semibold text-facamDark">Total</td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamDark">
                {byActivite.reduce((s, r) => s + r.count, 0)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamDark">
                {byActivite.reduce((s, r) => s + r.hours, 0).toFixed(1)} h
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-facamBlue">
                {formatEtp(byActivite.reduce((s, r) => s + r.hours, 0))} j
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
