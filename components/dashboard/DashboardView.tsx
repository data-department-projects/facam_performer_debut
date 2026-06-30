"use client";

import { useState, useEffect } from "react";
import { StatsBar } from "./StatsBar";
import { DashboardCharts } from "./DashboardCharts";
import { RecentActivity } from "./RecentActivity";
import { DashboardTable } from "./DashboardTable";
import { AlertsPanel } from "./AlertsPanel";
import { BudgetRiskChart } from "./BudgetRiskChart";
import { CommitteePerformanceTable } from "./CommitteePerformanceTable";
import { UpcomingMilestones } from "./UpcomingMilestones";
import { TodayTeamView } from "./TodayTeamView";
import { CollaboratorTodayPanel } from "./CollaboratorTodayPanel";
import { DashboardFilters } from "./DashboardFilters";
import type {
  DashboardActiveFilters,
  DashboardData,
  DashboardFilterOptions,
} from "./types";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// ─── Vue Admin ───────────────────────────────────────────────────────────────

function AdminDashboard({ data }: { data: DashboardData }) {
  const alertCount = data.alerts?.length ?? 0;
  const criticalCount = data.alerts?.filter((a) => a.severity === "critical").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Alertes critiques — toujours above the fold si présentes */}
      {alertCount > 0 && (
        <div className={criticalCount > 0 ? "ring-1 ring-error/30 rounded-xl" : ""}>
          <AlertsPanel alerts={data.alerts ?? []} />
        </div>
      )}

      {/* Graphiques principaux */}
      <DashboardCharts barChartData={data.barChartData} pieChartData={data.pieChartData} />

      {/* Matrice Budget Risk */}
      {data.budgetRiskData && data.budgetRiskData.length > 0 && (
        <BudgetRiskChart data={data.budgetRiskData} />
      )}

      {/* Jalons + Performance comités côte à côte */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {data.upcomingMilestones && (
          <UpcomingMilestones milestones={data.upcomingMilestones} />
        )}
        {data.committeeRows && data.committeeRows.length > 0 && (
          <CommitteePerformanceTable rows={data.committeeRows} />
        )}
      </div>

      {/* Activité récente + Tableau projets à confirmer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <RecentActivity items={data.recentActivity} />
        </div>
        <div className="lg:col-span-3">
          <DashboardTable role="ADMIN" data={data} />
        </div>
      </div>
    </div>
  );
}

// ─── Vue Manager ─────────────────────────────────────────────────────────────

function ManagerDashboard({ data }: { data: DashboardData }) {
  const alertCount = data.alerts?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Vue équipe du jour — première information opérationnelle */}
      {data.todayTeamView && data.todayTeamView.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TodayTeamView members={data.todayTeamView} />
          </div>
          <div className="lg:col-span-2">
            {alertCount > 0 ? (
              <AlertsPanel alerts={data.alerts ?? []} />
            ) : (
              <RecentActivity items={data.recentActivity} />
            )}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <DashboardCharts barChartData={data.barChartData} pieChartData={data.pieChartData} />

      {/* Jalons + État équipe */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {data.upcomingMilestones && (
          <UpcomingMilestones milestones={data.upcomingMilestones} />
        )}
        <DashboardTable role="MANAGER" data={data} />
      </div>

      {/* Alertes (si pas déjà affichées) + Activité récente */}
      {alertCount > 0 && data.todayTeamView && data.todayTeamView.length > 0 ? null : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <RecentActivity items={data.recentActivity} />
          </div>
          <div className="lg:col-span-3">
            {alertCount > 0 && <AlertsPanel alerts={data.alerts ?? []} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vue Collaborateur ───────────────────────────────────────────────────────

function CollaboratorDashboard({ data }: { data: DashboardData }) {
  const alertCount = data.alerts?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Ma journée — widget actionnable en priorité */}
      {data.collaboratorToday && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CollaboratorTodayPanel data={data.collaboratorToday} />
          </div>
          <div className="lg:col-span-2">
            {alertCount > 0 ? (
              <AlertsPanel alerts={data.alerts ?? []} />
            ) : (
              <RecentActivity items={data.recentActivity} />
            )}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <DashboardCharts barChartData={data.barChartData} pieChartData={data.pieChartData} />

      {/* Résultats clés + Activité */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {!(alertCount > 0 && data.collaboratorToday) && (
          <div className="lg:col-span-2">
            <RecentActivity items={data.recentActivity} />
          </div>
        )}
        <div className={alertCount > 0 && data.collaboratorToday ? "lg:col-span-5" : "lg:col-span-3"}>
          <DashboardTable role="COLLABORATOR" data={data} />
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function DashboardView({
  role,
  data,
  userName,
  filters,
  filterOptions,
}: {
  role: string;
  data: DashboardData;
  userName: string | null;
  filters: DashboardActiveFilters;
  filterOptions: DashboardFilterOptions;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName = userName?.split(" ")[0] ?? "Utilisateur";
  const greeting = now.getHours() >= 18 ? "Bonsoir" : "Bonjour";
  const dateStr = `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const criticalCount = data.alerts?.filter((a) => a.severity === "critical").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero banner ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ minHeight: "192px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/F36 (1).jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-facamDark/96 via-facamDark/80 to-facamDark/25" />
        <div className="relative z-10 flex min-h-[192px] items-center justify-between px-7 py-8 sm:px-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                suppressHydrationWarning
                className="rounded-full border border-facamWhite/20 bg-facamWhite/10 px-3 py-0.5 text-xs font-medium text-facamWhite/80 backdrop-blur-sm"
              >
                {dateStr} · {timeStr}
              </span>
              <span className="rounded-full bg-facamYellow px-3 py-0.5 text-xs font-bold text-facamDark">
                {ROLE_LABELS[role] ?? role}
              </span>
              {/* Badge alertes critiques dans le hero */}
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-error px-3 py-0.5 text-xs font-bold text-facamWhite animate-pulse">
                  ⚠ {criticalCount} alerte{criticalCount > 1 ? "s" : ""} critique{criticalCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div>
              <h1 suppressHydrationWarning className="text-2xl font-bold text-facamWhite sm:text-3xl">
                {greeting}, {firstName}&nbsp;!
              </h1>
              <p className="mt-1.5 text-sm text-facamWhite/65">
                Voici un aperçu de votre performance sur la plateforme.
              </p>
            </div>
          </div>
          <div className="hidden lg:block shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/facam_stairway-blanc.svg"
              alt="FACAM STAIRWAY"
              className="h-16 opacity-70"
            />
          </div>
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────── */}
      <DashboardFilters role={role} filters={filters} filterOptions={filterOptions} />

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <StatsBar kpis={data.kpis} />

      {/* ── Corps selon le rôle ───────────────────────────────────── */}
      {role === "ADMIN" ? (
        <AdminDashboard data={data} />
      ) : role === "MANAGER" ? (
        <ManagerDashboard data={data} />
      ) : (
        <CollaboratorDashboard data={data} />
      )}
    </div>
  );
}
