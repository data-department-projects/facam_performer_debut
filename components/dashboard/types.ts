export type DashboardPeriod = "week" | "month" | "quarter";

export type KpiCard = {
  label: string;
  value: string;
  color: "blue" | "success" | "yellow" | "error";
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

export type DashboardData = {
  kpis: KpiCard[];
  barChartData: BarChartItem[];
  pieChartData: PieChartItem[];
  recentActivity: ActivityItem[];
  tableRows: AdminProjectRow[] | ManagerTeamRow[] | CollaboratorKeyResultRow[];
};
