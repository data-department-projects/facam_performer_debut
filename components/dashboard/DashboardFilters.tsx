"use client";

import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import type { DashboardActiveFilters, DashboardFilterOptions, DashboardPeriod } from "./types";

// ─── Constantes statiques ────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
];

const MONTH_OPTIONS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
].map((label, i) => ({ value: String(i + 1), label: label.charAt(0).toUpperCase() + label.slice(1) }));

const MONTHS_FR_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

const QUARTER_OPTIONS = [
  { value: "1", label: "T1 (jan.-mars)" },
  { value: "2", label: "T2 (avr.-juin)" },
  { value: "3", label: "T3 (juil.-sept.)" },
  { value: "4", label: "T4 (oct.-déc.)" },
];

function getSelectableYears(): { value: string; label: string }[] {
  const current = new Date().getUTCFullYear();
  const years: { value: string; label: string }[] = [];
  for (let y = current + 1; y >= current - 5; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

function getWeeksInMonth(year: number, month: number): { value: string; label: string }[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const dow = firstDay.getUTCDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;

  let monday = new Date(Date.UTC(year, month - 1, 1 + offsetToMonday));
  while (monday.getTime() < firstDay.getTime()) {
    monday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const weeks: { value: string; label: string }[] = [];
  while (monday.getTime() <= lastDay.getTime()) {
    const friday = new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000);
    const label = `${String(monday.getUTCDate()).padStart(2, "0")}–${String(friday.getUTCDate()).padStart(2, "0")} ${MONTHS_FR_SHORT[friday.getUTCMonth()]}`;
    weeks.push({ value: monday.toISOString().slice(0, 10), label });
    monday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return weeks;
}

const PROJECT_STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "INITIATED", label: "Initié" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "PAUSED", label: "En pause" },
  { value: "DELIVERED", label: "Livré" },
  { value: "CANCELLED", label: "Annulé" },
];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "Toutes les priorités" },
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL_REGULATORY", label: "Critique" },
];

const OBJECTIVE_TYPE_OPTIONS = [
  { value: "ALL", label: "Tous les types" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "SKILLS_DEVELOPMENT", label: "Développement compétences" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(
  pathname: string,
  filters: DashboardActiveFilters,
  override: Partial<DashboardActiveFilters>,
): string {
  const merged = { ...filters, ...override };
  const params = new URLSearchParams();

  params.set("period", merged.period);
  params.set("year", String(merged.year));
  if (merged.period === "month" || merged.period === "week") params.set("month", String(merged.month));
  if (merged.period === "quarter") params.set("quarter", String(merged.quarter));
  if (merged.period === "week") params.set("week", merged.week);
  if (merged.departmentId) params.set("dept", merged.departmentId);
  if (merged.projectStatus && merged.projectStatus !== "ALL") params.set("status", merged.projectStatus);
  if (merged.strategicPriority && merged.strategicPriority !== "ALL") params.set("priority", merged.strategicPriority);
  if (merged.memberId) params.set("member", merged.memberId);
  if (merged.objectiveType && merged.objectiveType !== "ALL") params.set("objtype", merged.objectiveType);

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function countActiveFilters(filters: DashboardActiveFilters): number {
  let n = 0;
  if (filters.departmentId) n++;
  if (filters.projectStatus && filters.projectStatus !== "ALL") n++;
  if (filters.strategicPriority && filters.strategicPriority !== "ALL") n++;
  if (filters.memberId) n++;
  if (filters.objectiveType && filters.objectiveType !== "ALL") n++;
  return n;
}

// ─── Composants ──────────────────────────────────────────────────────────────

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-gray200 bg-facamWhite pl-3 pr-8 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-1 focus:ring-facamBlue/30 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron custom pour contourner l'apparence native */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray400 text-[10px]">
          ▼
        </span>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function DashboardFilters({
  role,
  filters,
  filterOptions,
  periodLabel,
}: Readonly<{
  role: string;
  filters: DashboardActiveFilters;
  filterOptions: DashboardFilterOptions;
  periodLabel?: string;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const activeCount = countActiveFilters(filters);

  function navigate(override: Partial<DashboardActiveFilters>) {
    router.push(buildUrl(pathname, filters, override));
  }

  function resetFilters() {
    router.push(
      buildUrl(pathname, filters, {
        departmentId: null,
        projectStatus: null,
        strategicPriority: null,
        memberId: null,
        objectiveType: null,
      }),
    );
  }

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Icône + label */}
        <div className="flex items-center gap-1.5 self-end pb-1.5 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-facamBlue" />
          <span className="text-sm font-semibold text-facamDark">Filtres</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-facamBlue px-1 text-[10px] font-bold text-facamWhite">
              {activeCount}
            </span>
          )}
        </div>

        {/* Séparateur vertical */}
        <div className="h-8 w-px bg-gray200 self-end hidden sm:block" />

        {/* ── Période ── (toujours visible, tous rôles) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
            Période
          </label>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => navigate({ period: opt.value })}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors h-8",
                  filters.period === opt.value
                    ? "bg-facamBlue text-facamWhite"
                    : "border border-gray200 text-gray600 hover:bg-gray50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Année (toujours visible — ancre pour mois/trimestre/année/semaine) ── */}
        <SelectFilter
          label="Année"
          value={String(filters.year)}
          options={getSelectableYears()}
          onChange={(v) => {
            const year = Number(v);
            if (filters.period === "week") {
              const weeks = getWeeksInMonth(year, filters.month);
              navigate({ year, week: weeks[0]?.value ?? filters.week });
            } else {
              navigate({ year });
            }
          }}
        />

        {/* ── Mois (Mois ou Semaine) ── */}
        {(filters.period === "month" || filters.period === "week") && (
          <SelectFilter
            label="Mois"
            value={String(filters.month)}
            options={MONTH_OPTIONS}
            onChange={(v) => {
              const month = Number(v);
              if (filters.period === "week") {
                const weeks = getWeeksInMonth(filters.year, month);
                navigate({ month, week: weeks[0]?.value ?? filters.week });
              } else {
                navigate({ month });
              }
            }}
          />
        )}

        {/* ── Semaine (dans le mois sélectionné) ── */}
        {filters.period === "week" && (
          <SelectFilter
            label="Semaine"
            value={filters.week}
            options={getWeeksInMonth(filters.year, filters.month)}
            onChange={(v) => navigate({ week: v })}
          />
        )}

        {/* ── Trimestre ── */}
        {filters.period === "quarter" && (
          <SelectFilter
            label="Trimestre"
            value={String(filters.quarter)}
            options={QUARTER_OPTIONS}
            onChange={(v) => navigate({ quarter: Number(v) })}
          />
        )}

        {/* ── Filtres Admin ── */}
        {role === "ADMIN" && filterOptions.departments.length > 0 && (
          <SelectFilter
            label="Département"
            value={filters.departmentId ?? "ALL"}
            options={[{ value: "ALL", label: "Tous les départements" }, ...filterOptions.departments]}
            onChange={(v) => navigate({ departmentId: v === "ALL" ? null : v })}
          />
        )}

        {(role === "ADMIN" || role === "MANAGER") && (
          <SelectFilter
            label="Statut projet"
            value={filters.projectStatus ?? "ALL"}
            options={PROJECT_STATUS_OPTIONS}
            onChange={(v) => navigate({ projectStatus: v === "ALL" ? null : v })}
          />
        )}

        {role === "ADMIN" && (
          <SelectFilter
            label="Priorité stratégique"
            value={filters.strategicPriority ?? "ALL"}
            options={PRIORITY_OPTIONS}
            onChange={(v) => navigate({ strategicPriority: v === "ALL" ? null : v })}
          />
        )}

        {/* ── Filtre Manager ── */}
        {role === "MANAGER" && filterOptions.members.length > 0 && (
          <SelectFilter
            label="Collaborateur"
            value={filters.memberId ?? "ALL"}
            options={[{ value: "ALL", label: "Toute l'équipe" }, ...filterOptions.members]}
            onChange={(v) => navigate({ memberId: v === "ALL" ? null : v })}
          />
        )}

        {/* ── Filtre Collaborateur ── */}
        {role === "COLLABORATOR" && (
          <SelectFilter
            label="Type d'objectif"
            value={filters.objectiveType ?? "ALL"}
            options={OBJECTIVE_TYPE_OPTIONS}
            onChange={(v) => navigate({ objectiveType: v === "ALL" ? null : v })}
          />
        )}

        {/* Bouton reset — affiché uniquement si des filtres non-période sont actifs */}
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            title="Réinitialiser tous les filtres"
            className="flex items-center gap-1 self-end mb-0.5 rounded-lg border border-gray200 px-3 py-1.5 text-xs font-medium text-gray500 hover:border-error hover:text-error transition-colors h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Effacer
          </button>
        )}

        {/* Chips filtres actifs — résumé rapide */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1 self-end mb-0.5">
            {filters.departmentId && (
              <ActiveChip
                label={filterOptions.departments.find((d) => d.value === filters.departmentId)?.label ?? filters.departmentId}
                onRemove={() => navigate({ departmentId: null })}
              />
            )}
            {filters.projectStatus && filters.projectStatus !== "ALL" && (
              <ActiveChip
                label={PROJECT_STATUS_OPTIONS.find((o) => o.value === filters.projectStatus)?.label ?? filters.projectStatus}
                onRemove={() => navigate({ projectStatus: null })}
              />
            )}
            {filters.strategicPriority && filters.strategicPriority !== "ALL" && (
              <ActiveChip
                label={PRIORITY_OPTIONS.find((o) => o.value === filters.strategicPriority)?.label ?? filters.strategicPriority}
                onRemove={() => navigate({ strategicPriority: null })}
              />
            )}
            {filters.memberId && (
              <ActiveChip
                label={filterOptions.members.find((m) => m.value === filters.memberId)?.label ?? filters.memberId}
                onRemove={() => navigate({ memberId: null })}
              />
            )}
            {filters.objectiveType && filters.objectiveType !== "ALL" && (
              <ActiveChip
                label={OBJECTIVE_TYPE_OPTIONS.find((o) => o.value === filters.objectiveType)?.label ?? filters.objectiveType}
                onRemove={() => navigate({ objectiveType: null })}
              />
            )}
          </div>
        )}
      </div>

      {periodLabel && (
        <p className="mt-2 text-xs font-medium text-facamBlue">→ {periodLabel}</p>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-semibold text-facamBlue">
      {label}
      <button onClick={onRemove} className="hover:text-error ml-0.5">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
