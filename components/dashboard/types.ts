export type DashboardPeriod = "week" | "month" | "quarter" | "year";

export type KpiCard = {
  label: string;
  value: string;
  color: "blue" | "success" | "yellow" | "error";
  trend?: { value: number; label: string }; // ex: +12 → "+12% vs semaine préc."
  sub?: string; // info secondaire sous la valeur principale
};

export type BarChartItem = {
  name: string;
  progress: number;
};

export type PieChartItem = {
  name: string;
  value: number;
  color: string;
};

export type ActivityItem = {
  id: string;
  type: "project" | "week-planner" | "committee" | "objective";
  description: string;
  actor: string;
  timestamp: string;
};

// ─── Tables par rôle ────────────────────────────────────────────────────────

export type AdminProjectRow = {
  id: string;
  code: string;
  name: string;
  managerName: string;
  createdAt: string;
  strategicPriority: string;
};

export type ManagerTeamRow = {
  id: string;
  collaboratorName: string;
  weekStatus: "DRAFT" | "SUBMITTED" | "VALIDATED" | "NONE";
  totalTasks: number;
  doneTasks: number;
};

export type CollaboratorKeyResultRow = {
  id: string;
  objectiveName: string;
  description: string;
  targetValue: number | null;
  currentValue: number | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
};

// ─── Alertes intelligentes ──────────────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "info";

export type AlertItem = {
  id: string;
  severity: AlertSeverity;
  message: string;
  href?: string; // lien vers l'entité concernée
};

// ─── Budget risk (Admin — scatter plot) ─────────────────────────────────────

export type BudgetRiskItem = {
  id: string;
  name: string;
  code: string;
  progressPercent: number; // avancement moyen des tâches Gantt (axe X)
  budgetConsumedPercent: number; // consumedBudget / initialBudget * 100 (axe Y)
  priority: string; // pour la couleur du point
  initialBudget: number;
};

// ─── Performance des comités (Admin) ────────────────────────────────────────

export type CommitteeRow = {
  id: string;
  name: string;
  frequency: string;
  totalActions: number;
  doneActions: number;
  overdueActions: number;
  completionRate: number; // % DONE
  nextMeetingDate: string | null;
};

// ─── Jalons à venir (Admin + Manager) ───────────────────────────────────────

export type MilestoneRow = {
  id: string;
  projectName: string;
  projectCode: string;
  title: string;
  targetDate: string;
  daysUntil: number; // négatif = dépassé
  isOverdue: boolean;
};

// ─── Vue équipe aujourd'hui (Manager) ───────────────────────────────────────

export type TodayTeamMemberRow = {
  userId: string;
  collaboratorName: string;
  initials: string;
  totalTasksToday: number;
  doneToday: number;
  inProgressToday: number;
  notDoneToday: number;
  notStartedToday: number;
  plannerStatus: "VALIDATED" | "SUBMITTED" | "DRAFT" | "NONE";
};

// ─── Tâches du jour (Collaborateur) ─────────────────────────────────────────

export type TodayTask = {
  id: string;
  title: string;
  projectName: string | null;
  status: "STARTED" | "IN_PROGRESS" | "DONE" | "NOT_DONE";
  comment: string | null;
};

export type CollaboratorTodayData = {
  tasks: TodayTask[];
  weekPlannerStatus: "VALIDATED" | "SUBMITTED" | "DRAFT" | "NONE";
  nextWeekPlannerStatus: "VALIDATED" | "SUBMITTED" | "DRAFT" | "NONE";
  hoursToday: number;
};

// ─── Filtres actifs ─────────────────────────────────────────────────────────

export type DashboardActiveFilters = {
  period: DashboardPeriod;
  departmentId: string | null;     // Admin : null = tous les départements
  projectStatus: string | null;    // Admin + Manager : null = tous les statuts
  strategicPriority: string | null; // Admin : null = toutes les priorités
  memberId: string | null;         // Manager : null = tous les membres
  objectiveType: string | null;    // Collaborateur : null = tous les types
};

export type FilterOption = {
  value: string;
  label: string;
};

export type DashboardFilterOptions = {
  departments: FilterOption[];   // Admin uniquement
  members: FilterOption[];       // Manager uniquement
};

// ─── Structure principale DashboardData ────────────────────────────────────

export type DashboardData = {
  kpis: KpiCard[];
  barChartData: BarChartItem[];
  pieChartData: PieChartItem[];
  recentActivity: ActivityItem[];
  tableRows: AdminProjectRow[] | ManagerTeamRow[] | CollaboratorKeyResultRow[];

  // Nouveaux widgets BI
  alerts?: AlertItem[];
  budgetRiskData?: BudgetRiskItem[];         // Admin uniquement
  committeeRows?: CommitteeRow[];            // Admin uniquement
  upcomingMilestones?: MilestoneRow[];       // Admin + Manager
  todayTeamView?: TodayTeamMemberRow[];      // Manager uniquement
  collaboratorToday?: CollaboratorTodayData; // Collaborateur uniquement
};
