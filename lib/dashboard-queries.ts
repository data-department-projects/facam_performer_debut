import type { Prisma, ProjectStatus, Role, TaskStatus } from "@/app/generated/prisma/client";
import type {
  ActivityItem,
  AdminProjectRow,
  AlertItem,
  BarChartItem,
  BudgetRiskItem,
  CollaboratorKeyResultRow,
  CollaboratorTodayData,
  CommitteeRow,
  DashboardActiveFilters,
  DashboardData,
  DashboardPeriod,
  ManagerTeamRow,
  MilestoneRow,
  PieChartItem,
  TodayTask,
  TodayTeamMemberRow,
} from "@/components/dashboard/types";
import { prisma } from "@/lib/prisma";

// Alias interne — sous-ensemble des filtres UI qui affectent les requêtes DB
type ActiveFilters = Omit<DashboardActiveFilters, "period">;

export type EtpEntry = {
  id: string;
  collaboratorName: string;
  initials: string;
  department: string;
  team: string;
  activityLabel: string;
  hoursSpent: number;
  date: string;
};

export type TeamCharge = {
  team: string;
  department: string;
  consumedHours: number;
  availableHours: number;
};

type PeriodRange = {
  startDate: Date;
  endDate: Date;
  endExclusiveDate: Date;
  workingDays: number;
  label: string;
};

type DashboardContext = {
  role: Role;
  userId: string;
  departmentId: string | null;
};

type ProjectWithProgress = {
  id: string;
  name: string;
  ganttTasks: { progressPercent: number }[];
};

const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  "PENDING",
  "INITIATED",
  "IN_PROGRESS",
  "PAUSED",
];

const TASK_STATUS_CONFIG: {
  status: TaskStatus;
  label: string;
  color: string;
}[] = [
  { status: "DONE", label: "Terminé", color: "#16a34a" },
  { status: "IN_PROGRESS", label: "En cours", color: "#ffae03" },
  { status: "NOT_DONE", label: "Non terminé", color: "#b91c1c" },
  { status: "STARTED", label: "Débuté", color: "#d1d5db" },
];

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  AD_HOC: "Ponctuel",
};

function getPeriodRange(period: DashboardPeriod): PeriodRange {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === "week") {
    const dow = now.getUTCDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(Date.UTC(y, m, d + toMon));
    const friday = new Date(Date.UTC(y, m, d + toMon + 4));
    const saturday = new Date(Date.UTC(y, m, d + toMon + 5));
    const label = `Semaine du ${monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} au ${friday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`;
    return {
      startDate: monday,
      endDate: friday,
      endExclusiveDate: saturday,
      workingDays: 5,
      label,
    };
  }

  if (period === "month") {
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    const endExclusive = new Date(Date.UTC(y, m + 1, 1));
    const raw = now.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    return {
      startDate: start,
      endDate: end,
      endExclusiveDate: endExclusive,
      workingDays: 21,
      label,
    };
  }

  if (period === "year") {
    return {
      startDate: new Date(Date.UTC(y, 0, 1)),
      endDate: new Date(Date.UTC(y, 11, 31)),
      endExclusiveDate: new Date(Date.UTC(y + 1, 0, 1)),
      workingDays: 252,
      label: String(y),
    };
  }

  const q = Math.floor(m / 3);
  const qStart = new Date(Date.UTC(y, q * 3, 1));
  const qEnd = new Date(Date.UTC(y, q * 3 + 3, 0));
  const qEndExclusive = new Date(Date.UTC(y, q * 3 + 3, 1));
  return {
    startDate: qStart,
    endDate: qEnd,
    endExclusiveDate: qEndExclusive,
    workingDays: 63,
    label: `T${q + 1} ${y}`,
  };
}

function getPrevPeriodRange(period: DashboardPeriod): PeriodRange {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === "week") {
    const dow = now.getUTCDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const prevMonday = new Date(Date.UTC(y, m, d + toMon - 7));
    const prevFriday = new Date(Date.UTC(y, m, d + toMon - 3));
    const prevSaturday = new Date(Date.UTC(y, m, d + toMon - 2));
    return {
      startDate: prevMonday,
      endDate: prevFriday,
      endExclusiveDate: prevSaturday,
      workingDays: 5,
      label: "Semaine précédente",
    };
  }

  if (period === "month") {
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0));
    const endExclusive = new Date(Date.UTC(y, m, 1));
    return {
      startDate: start,
      endDate: end,
      endExclusiveDate: endExclusive,
      workingDays: 21,
      label: "Mois précédent",
    };
  }

  if (period === "year") {
    return {
      startDate: new Date(Date.UTC(y - 1, 0, 1)),
      endDate: new Date(Date.UTC(y - 1, 11, 31)),
      endExclusiveDate: new Date(Date.UTC(y, 0, 1)),
      workingDays: 252,
      label: String(y - 1),
    };
  }

  const q = Math.floor(m / 3);
  const prevQ = q === 0 ? 3 : q - 1;
  const prevQYear = q === 0 ? y - 1 : y;
  return {
    startDate: new Date(Date.UTC(prevQYear, prevQ * 3, 1)),
    endDate: new Date(Date.UTC(prevQYear, prevQ * 3 + 3, 0)),
    endExclusiveDate: new Date(Date.UTC(prevQYear, prevQ * 3 + 3, 1)),
    workingDays: 63,
    label: `T${prevQ + 1} ${prevQYear}`,
  };
}

function formatIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function percentage(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function trendDelta(current: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(current - prev);
}

function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getCurrentWeekMonday(): Date {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dow = now.getUTCDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  return new Date(Date.UTC(y, m, d + toMon));
}

function getNextWeekMonday(): Date {
  const monday = getCurrentWeekMonday();
  return new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function todayDayEnum(): string {
  const dow = new Date().getUTCDay();
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dow];
}

function getWeekPlannerScope(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
): Prisma.WeekPlannerWhereInput {
  if (ctx.role === "ADMIN") {
    return filters?.departmentId
      ? { user: { departmentId: filters.departmentId } }
      : {};
  }
  if (ctx.role === "MANAGER") {
    const base = { user: { team: { managerId: ctx.userId } } };
    if (filters?.memberId) {
      return { userId: filters.memberId, user: { team: { managerId: ctx.userId } } };
    }
    return base;
  }
  return { userId: ctx.userId };
}

function getWeekPlannerTaskWhere(
  ctx: DashboardContext,
  range: PeriodRange,
  filters?: Partial<ActiveFilters>,
): Prisma.WeekPlannerTaskWhereInput {
  return {
    weekPlanner: {
      weekStartDate: { gte: range.startDate, lte: range.endDate },
      ...getWeekPlannerScope(ctx, filters),
    },
  };
}

function getConfirmedActiveProjectWhere(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
): Prisma.ProjectWhereInput {
  const statusFilter: Prisma.ProjectWhereInput =
    filters?.projectStatus && filters.projectStatus !== "ALL"
      ? { currentStatus: filters.projectStatus as ProjectStatus }
      : { currentStatus: { in: ACTIVE_PROJECT_STATUSES } };

  const priorityFilter: Prisma.ProjectWhereInput =
    filters?.strategicPriority && filters.strategicPriority !== "ALL"
      ? { strategicPriority: filters.strategicPriority as never }
      : {};

  const base: Prisma.ProjectWhereInput = {
    isConfirmed: true,
    ...statusFilter,
    ...priorityFilter,
  };

  if (ctx.role === "ADMIN") {
    if (filters?.departmentId) {
      return {
        AND: [
          base,
          {
            OR: [
              { beneficiaryDepartmentId: filters.departmentId },
              { teamMembers: { some: { user: { departmentId: filters.departmentId } } } },
              { projectManager: { departmentId: filters.departmentId } },
            ],
          },
        ],
      };
    }
    return base;
  }

  if (ctx.role === "MANAGER") {
    if (!ctx.departmentId) return { id: "__no_department__" };
    const memberScope: Prisma.ProjectWhereInput = filters?.memberId
      ? { teamMembers: { some: { userId: filters.memberId } } }
      : {
          OR: [
            { projectManagerId: ctx.userId },
            { beneficiaryDepartmentId: ctx.departmentId },
            { teamMembers: { some: { user: { departmentId: ctx.departmentId } } } },
          ],
        };
    return { AND: [base, memberScope] };
  }

  return {
    AND: [
      base,
      {
        OR: [
          { teamMembers: { some: { userId: ctx.userId } } },
          { ganttTasks: { some: { responsibleUserId: ctx.userId } } },
        ],
      },
    ],
  };
}

function getCommitteeActionScope(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
): Prisma.CommitteeActionWhereInput {
  if (ctx.role === "ADMIN") {
    return filters?.departmentId
      ? { responsible: { departmentId: filters.departmentId } }
      : {};
  }
  if (ctx.role === "MANAGER") {
    const deptScope = ctx.departmentId
      ? { responsible: { departmentId: ctx.departmentId } }
      : { id: "__no_department__" };
    if (filters?.memberId) {
      return { ...deptScope, responsibleUserId: filters.memberId };
    }
    return deptScope;
  }
  return { responsibleUserId: ctx.userId };
}

function getProjectProgress(project: ProjectWithProgress): number {
  if (project.ganttTasks.length === 0) return 0;
  const total = project.ganttTasks.reduce((sum, task) => sum + task.progressPercent, 0);
  return Math.round(total / project.ganttTasks.length);
}

function toBarChartItems(projects: ProjectWithProgress[]): BarChartItem[] {
  return projects.slice(0, 5).map((project) => ({
    name: project.name,
    progress: getProjectProgress(project),
  }));
}

function toPieChartItems(
  groupedStatuses: { status: TaskStatus; _count: { _all: number } }[],
): PieChartItem[] {
  return TASK_STATUS_CONFIG.map((config) => {
    const row = groupedStatuses.find((item) => item.status === config.status);
    return {
      name: config.label,
      value: row?._count._all ?? 0,
      color: config.color,
    };
  });
}

async function getProjectProgressRows(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
): Promise<ProjectWithProgress[]> {
  return prisma.project.findMany({
    where: getConfirmedActiveProjectWhere(ctx, filters),
    select: {
      id: true,
      name: true,
      ganttTasks: { select: { progressPercent: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getTaskStatusGroups(
  ctx: DashboardContext,
  range: PeriodRange,
  filters?: Partial<ActiveFilters>,
): Promise<{ status: TaskStatus; _count: { _all: number } }[]> {
  const baseWhere = getWeekPlannerTaskWhere(ctx, range, filters);
  const statuses: TaskStatus[] = ["DONE", "IN_PROGRESS", "NOT_DONE", "STARTED"];
  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.weekPlannerTask.count({ where: { ...baseWhere, status } }),
    ),
  );
  return statuses.map((status, i) => ({ status, _count: { _all: counts[i] } }));
}

async function countActionsToProcess(ctx: DashboardContext): Promise<number> {
  const today = getTodayUtc();

  if (ctx.role === "ADMIN") {
    const [pendingProjects, submittedPlanners, overdueActions] = await Promise.all([
      prisma.project.count({ where: { isConfirmed: false } }),
      prisma.weekPlanner.count({ where: { status: "SUBMITTED", user: { role: "MANAGER" } } }),
      prisma.committeeAction.count({
        where: { status: "PENDING", dueDate: { lt: today } },
      }),
    ]);
    return pendingProjects + submittedPlanners + overdueActions;
  }

  if (ctx.role === "MANAGER") {
    const [submittedPlanners, overdueActions] = await Promise.all([
      prisma.weekPlanner.count({
        where: { status: "SUBMITTED", user: { team: { managerId: ctx.userId } } },
      }),
      prisma.committeeAction.count({
        where: { status: "PENDING", dueDate: { lt: today }, ...getCommitteeActionScope(ctx) },
      }),
    ]);
    return submittedPlanners + overdueActions;
  }

  return prisma.committeeAction.count({
    where: { status: "PENDING", dueDate: { lt: today }, responsibleUserId: ctx.userId },
  });
}

async function getCommitteeCompletionRate(
  ctx: DashboardContext,
  range: PeriodRange,
  filters?: Partial<ActiveFilters>,
): Promise<number> {
  const groups = await prisma.committeeAction.groupBy({
    by: ["status"],
    where: {
      dueDate: { gte: range.startDate, lte: range.endDate },
      ...getCommitteeActionScope(ctx, filters),
    },
    _count: { _all: true },
  });
  const total = groups.reduce((sum, g) => sum + g._count._all, 0);
  const done = groups.find((g) => g.status === "DONE")?._count._all ?? 0;
  return percentage(done, total);
}

async function getObjectiveCompletionRate(userId: string, range: PeriodRange): Promise<number> {
  const groups = await prisma.keyResult.groupBy({
    by: ["status"],
    where: {
      objective: {
        userId,
        periodStart: { lte: range.endDate },
        periodEnd: { gte: range.startDate },
      },
    },
    _count: { _all: true },
  });
  const total = groups.reduce((sum, g) => sum + g._count._all, 0);
  const done = groups.find((g) => g.status === "DONE")?._count._all ?? 0;
  return percentage(done, total);
}

async function getAdminProjectRows(): Promise<AdminProjectRow[]> {
  const projects = await prisma.project.findMany({
    where: { isConfirmed: false },
    select: {
      id: true,
      code: true,
      name: true,
      createdAt: true,
      strategicPriority: true,
      projectManager: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  return projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    managerName: p.projectManager.fullName,
    createdAt: formatIsoDate(p.createdAt) ?? "",
    strategicPriority: p.strategicPriority,
  }));
}

async function getManagerTeamRows(
  userId: string,
  memberId?: string | null,
): Promise<ManagerTeamRow[]> {
  const weekRange = getPeriodRange("week");
  const collaborators = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "COLLABORATOR",
      team: { managerId: userId },
      ...(memberId ? { id: memberId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      weekPlanners: {
        where: { weekStartDate: weekRange.startDate },
        select: { status: true, tasks: { select: { status: true } } },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  return collaborators.map((c) => {
    const planner = c.weekPlanners[0];
    const tasks = planner?.tasks ?? [];
    return {
      id: c.id,
      collaboratorName: c.fullName,
      weekStatus: planner?.status ?? "NONE",
      totalTasks: tasks.length,
      doneTasks: tasks.filter((t) => t.status === "DONE").length,
    };
  });
}

async function getCollaboratorKeyResultRows(
  ctx: DashboardContext,
  range: PeriodRange,
  objectiveType?: string | null,
): Promise<CollaboratorKeyResultRow[]> {
  const rows = await prisma.keyResult.findMany({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      objective: {
        userId: ctx.userId,
        periodStart: { lte: range.endDate },
        periodEnd: { gte: range.startDate },
        ...(objectiveType && objectiveType !== "ALL" ? { type: objectiveType as never } : {}),
      },
    },
    select: {
      id: true,
      description: true,
      targetValue: true,
      currentValue: true,
      status: true,
      dueDate: true,
      objective: { select: { name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 8,
  });

  return rows.map((r) => ({
    id: r.id,
    objectiveName: r.objective.name,
    description: r.description,
    targetValue: r.targetValue === null ? null : Number(r.targetValue),
    currentValue: r.currentValue === null ? null : Number(r.currentValue),
    status: r.status,
    dueDate: formatIsoDate(r.dueDate),
  }));
}

async function getNextMeetingLabel(userId: string): Promise<string> {
  const meeting = await prisma.committeeMeeting.findFirst({
    where: {
      startDateTime: { gte: new Date() },
      committee: { members: { some: { userId } } },
    },
    select: { startDateTime: true },
    orderBy: { startDateTime: "asc" },
  });

  if (!meeting) return "Aucune";

  const raw = meeting.startDateTime.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

async function getRecentActivity(
  ctx: DashboardContext,
  range: PeriodRange,
  filters?: Partial<ActiveFilters>,
): Promise<ActivityItem[]> {
  const projectWhere = getConfirmedActiveProjectWhere(ctx, filters);
  const weekPlannerScope = getWeekPlannerScope(ctx, filters);
  const committeeScope = getCommitteeActionScope(ctx, filters);
  const keyResultScope: Prisma.KeyResultWhereInput =
    ctx.role === "ADMIN"
      ? {}
      : ctx.role === "MANAGER"
        ? ctx.departmentId
          ? { objective: { user: { departmentId: ctx.departmentId } } }
          : { id: "__no_department__" }
        : { objective: { userId: ctx.userId } };

  const [projects, planners, actions, keyResults] = await Promise.all([
    prisma.project.findMany({
      where: { ...projectWhere, createdAt: { gte: range.startDate, lt: range.endExclusiveDate } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        projectManager: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.weekPlanner.findMany({
      where: { ...weekPlannerScope, createdAt: { gte: range.startDate, lt: range.endExclusiveDate } },
      select: {
        id: true,
        createdAt: true,
        weekStartDate: true,
        weekEndDate: true,
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.committeeAction.findMany({
      where: { ...committeeScope, createdAt: { gte: range.startDate, lt: range.endExclusiveDate } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        responsible: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.keyResult.findMany({
      where: { ...keyResultScope, updatedAt: { gte: range.startDate, lt: range.endExclusiveDate } },
      select: {
        id: true,
        description: true,
        updatedAt: true,
        objective: { select: { user: { select: { fullName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const activity: ActivityItem[] = [
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      description: `Projet « ${p.name} » créé`,
      actor: p.projectManager.fullName,
      timestamp: p.createdAt.toISOString(),
    })),
    ...planners.map((pl) => ({
      id: `week-planner-${pl.id}`,
      type: "week-planner" as const,
      description: `Semaine du ${formatIsoDate(pl.weekStartDate)} au ${formatIsoDate(pl.weekEndDate)} planifiée`,
      actor: pl.user.fullName,
      timestamp: pl.createdAt.toISOString(),
    })),
    ...actions.map((a) => ({
      id: `committee-${a.id}`,
      type: "committee" as const,
      description: `Action « ${a.title} » créée`,
      actor: a.responsible.fullName,
      timestamp: a.createdAt.toISOString(),
    })),
    ...keyResults.map((kr) => ({
      id: `objective-${kr.id}`,
      type: "objective" as const,
      description: `Résultat clé « ${kr.description} » mis à jour`,
      actor: kr.objective.user.fullName,
      timestamp: kr.updatedAt.toISOString(),
    })),
  ];

  return activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

// ─── Nouvelles requêtes BI ──────────────────────────────────────────────────

async function getSmartAlerts(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
): Promise<AlertItem[]> {
  const today = getTodayUtc();
  const alerts: AlertItem[] = [];

  if (ctx.role === "ADMIN" || ctx.role === "MANAGER") {
    const projectScope = getConfirmedActiveProjectWhere(ctx, filters);

    // Projets avec budget > 80% consommé mais avancement < 60%
    const riskyProjects = await prisma.project.findMany({
      where: {
        ...projectScope,
        initialBudget: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        code: true,
        initialBudget: true,
        expenses: { select: { amount: true } },
        ganttTasks: { select: { progressPercent: true } },
      },
    });

    for (const p of riskyProjects) {
      const totalExpenses = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
      const budgetRate = Number(p.initialBudget) > 0
        ? (totalExpenses / Number(p.initialBudget)) * 100
        : 0;
      const avgProgress = p.ganttTasks.length > 0
        ? p.ganttTasks.reduce((s, t) => s + t.progressPercent, 0) / p.ganttTasks.length
        : 0;

      if (budgetRate > 100) {
        alerts.push({
          id: `budget-overrun-${p.id}`,
          severity: "critical",
          message: `${p.code} — Budget dépassé (${Math.round(budgetRate)}% consommé)`,
          href: `/projects/${p.id}`,
        });
      } else if (budgetRate > 80 && avgProgress < 60) {
        alerts.push({
          id: `budget-risk-${p.id}`,
          severity: "high",
          message: `${p.code} — Budget à ${Math.round(budgetRate)}% mais seulement ${Math.round(avgProgress)}% d'avancement`,
          href: `/projects/${p.id}`,
        });
      }
    }

    // Projets en retard (targetEndDate dépassée, non livrés)
    const overdueProjects = await prisma.project.findMany({
      where: {
        ...projectScope,
        targetEndDate: { lt: today },
        currentStatus: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      select: { id: true, code: true, name: true, targetEndDate: true },
      take: 3,
    });

    for (const p of overdueProjects) {
      const daysLate = Math.floor(
        (today.getTime() - p.targetEndDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        id: `overdue-project-${p.id}`,
        severity: daysLate > 14 ? "critical" : "high",
        message: `${p.code} — En retard de ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
        href: `/projects/${p.id}`,
      });
    }

    // Jalons manqués
    const overdueMilestones = await prisma.projectMilestone.findMany({
      where: {
        targetDate: { lt: today },
        achievedDate: null,
        project: projectScope,
      },
      select: { id: true, title: true, project: { select: { code: true, id: true } } },
      take: 3,
    });

    for (const ms of overdueMilestones) {
      alerts.push({
        id: `overdue-milestone-${ms.id}`,
        severity: "high",
        message: `Jalon manqué : « ${ms.title} » (${ms.project.code})`,
        href: `/projects/${ms.project.id}`,
      });
    }

    // Actions de comité en retard > 7 jours
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const overdueActions = await prisma.committeeAction.count({
      where: {
        status: "PENDING",
        dueDate: { lt: sevenDaysAgo },
        ...getCommitteeActionScope(ctx, filters),
      },
    });

    if (overdueActions > 0) {
      alerts.push({
        id: "overdue-committee-actions",
        severity: "high",
        message: `${overdueActions} action${overdueActions > 1 ? "s" : ""} de comité en retard de plus de 7 jours`,
        href: "/committees",
      });
    }

    if (ctx.role === "ADMIN") {
      // Projets en attente de confirmation depuis > 5 jours
      const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const staleUnconfirmed = await prisma.project.count({
        where: { isConfirmed: false, createdAt: { lt: fiveDaysAgo } },
      });

      if (staleUnconfirmed > 0) {
        alerts.push({
          id: "stale-unconfirmed",
          severity: "medium",
          message: `${staleUnconfirmed} projet${staleUnconfirmed > 1 ? "s" : ""} en attente de confirmation depuis plus de 5 jours`,
          href: "/actions-to-process",
        });
      }

      // Week Planners soumis non validés depuis > 2 jours
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const stalePlanners = await prisma.weekPlanner.count({
        where: { status: "SUBMITTED", user: { role: "MANAGER" }, createdAt: { lt: twoDaysAgo } },
      });

      if (stalePlanners > 0) {
        alerts.push({
          id: "stale-submitted-planners",
          severity: "medium",
          message: `${stalePlanners} planning${stalePlanners > 1 ? "s" : ""} soumis non validé${stalePlanners > 1 ? "s" : ""} depuis plus de 2 jours`,
          href: "/actions-to-process",
        });
      }
    }

    if (ctx.role === "MANAGER") {
      // Plannings de l'équipe non soumis (DRAFT en fin de semaine)
      const draftPlanners = await prisma.weekPlanner.count({
        where: {
          status: "DRAFT",
          weekStartDate: getCurrentWeekMonday(),
          user: { team: { managerId: ctx.userId } },
        },
      });

      if (draftPlanners > 0) {
        alerts.push({
          id: "draft-team-planners",
          severity: "medium",
          message: `${draftPlanners} collaborateur${draftPlanners > 1 ? "s" : ""} n'ont pas encore soumis leur planning cette semaine`,
          href: "/actions-to-process",
        });
      }
    }
  }

  // Résultats clés expirés (tous rôles)
  const krScope: Prisma.KeyResultWhereInput =
    ctx.role === "ADMIN"
      ? {}
      : ctx.role === "MANAGER"
        ? ctx.departmentId
          ? { objective: { user: { departmentId: ctx.departmentId } } }
          : {}
        : { objective: { userId: ctx.userId } };

  const expiredKr = await prisma.keyResult.count({
    where: { ...krScope, status: { not: "DONE" }, dueDate: { lt: today } },
  });

  if (expiredKr > 0) {
    alerts.push({
      id: "expired-key-results",
      severity: ctx.role === "COLLABORATOR" ? "high" : "medium",
      message: `${expiredKr} résultat${expiredKr > 1 ? "s" : ""} clé${expiredKr > 1 ? "s" : ""} dépassé${expiredKr > 1 ? "s" : ""} non terminé${expiredKr > 1 ? "s" : ""}`,
      href: "/objectives",
    });
  }

  // Trier par sévérité
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, info: 3 };
  return alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)).slice(0, 8);
}

async function getAdminBudgetRiskData(): Promise<BudgetRiskItem[]> {
  const projects = await prisma.project.findMany({
    where: {
      isConfirmed: true,
      currentStatus: { in: ACTIVE_PROJECT_STATUSES },
      initialBudget: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      code: true,
      initialBudget: true,
      expenses: { select: { amount: true } },
      strategicPriority: true,
      ganttTasks: { select: { progressPercent: true } },
    },
  });

  return projects.map((p) => {
    const avgProgress =
      p.ganttTasks.length > 0
        ? Math.round(
            p.ganttTasks.reduce((s, t) => s + t.progressPercent, 0) / p.ganttTasks.length,
          )
        : 0;
    const totalExpenses = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const budgetConsumedPercent = Math.round(
      (totalExpenses / Number(p.initialBudget)) * 100,
    );

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      progressPercent: avgProgress,
      budgetConsumedPercent,
      priority: p.strategicPriority,
      initialBudget: Number(p.initialBudget),
    };
  });
}

async function getAdminCommitteeRows(): Promise<CommitteeRow[]> {
  const now = new Date();
  const committees = await prisma.committee.findMany({
    select: {
      id: true,
      name: true,
      frequency: true,
      meetings: {
        select: {
          startDateTime: true,
          actions: {
            select: { status: true, dueDate: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const today = getTodayUtc();

  return committees.map((c) => {
    const allActions = c.meetings.flatMap((m) => m.actions);
    const totalActions = allActions.length;
    const doneActions = allActions.filter((a) => a.status === "DONE").length;
    const overdueActions = allActions.filter(
      (a) => a.status === "PENDING" && a.dueDate && a.dueDate < today,
    ).length;
    const completionRate = percentage(doneActions, totalActions);

    const futureMeetings = c.meetings
      .filter((m) => m.startDateTime >= now)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
    const nextMeeting = futureMeetings[0]?.startDateTime ?? null;

    return {
      id: c.id,
      name: c.name,
      frequency: FREQUENCY_LABEL[c.frequency] ?? c.frequency,
      totalActions,
      doneActions,
      overdueActions,
      completionRate,
      nextMeetingDate: nextMeeting
        ? nextMeeting.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    };
  });
}

async function getUpcomingMilestones(
  ctx: DashboardContext,
  filters?: Partial<ActiveFilters>,
  horizonDays = 14,
): Promise<MilestoneRow[]> {
  const today = getTodayUtc();
  const horizon = new Date(today.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const pastThreshold = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const milestones = await prisma.projectMilestone.findMany({
    where: {
      achievedDate: null,
      targetDate: { gte: pastThreshold, lte: horizon },
      project: getConfirmedActiveProjectWhere(ctx, filters),
    },
    select: {
      id: true,
      title: true,
      targetDate: true,
      project: { select: { id: true, name: true, code: true } },
    },
    orderBy: { targetDate: "asc" },
    take: 8,
  });

  return milestones.map((ms) => {
    const daysUntil = Math.floor(
      (ms.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      id: ms.id,
      projectName: ms.project.name,
      projectCode: ms.project.code,
      title: ms.title,
      targetDate: formatIsoDate(ms.targetDate) ?? "",
      daysUntil,
      isOverdue: daysUntil < 0,
    };
  });
}

async function getManagerTodayView(
  userId: string,
  memberId?: string | null,
): Promise<TodayTeamMemberRow[]> {
  const monday = getCurrentWeekMonday();
  const todayDay = todayDayEnum();

  const collaborators = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "COLLABORATOR",
      team: { managerId: userId },
      ...(memberId ? { id: memberId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      weekPlanners: {
        where: { weekStartDate: monday },
        select: {
          status: true,
          tasks: {
            where: { plannedDay: todayDay as "MON" | "TUE" | "WED" | "THU" | "FRI" },
            select: { status: true },
          },
        },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  return collaborators.map((c) => {
    const parts = c.fullName.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : c.fullName.slice(0, 2).toUpperCase();

    const planner = c.weekPlanners[0];
    const tasks = planner?.tasks ?? [];

    return {
      userId: c.id,
      collaboratorName: c.fullName,
      initials,
      totalTasksToday: tasks.length,
      doneToday: tasks.filter((t) => t.status === "DONE").length,
      inProgressToday: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      notDoneToday: tasks.filter((t) => t.status === "NOT_DONE").length,
      notStartedToday: tasks.filter((t) => t.status === "STARTED").length,
      plannerStatus: (planner?.status ?? "NONE") as TodayTeamMemberRow["plannerStatus"],
    };
  });
}

async function getCollaboratorTodayData(userId: string): Promise<CollaboratorTodayData> {
  const monday = getCurrentWeekMonday();
  const nextMonday = getNextWeekMonday();
  const today = getTodayUtc();
  const todayDay = todayDayEnum();

  const [currentPlanner, nextPlanner, timeEntries] = await Promise.all([
    prisma.weekPlanner.findFirst({
      where: { userId, weekStartDate: monday },
      select: {
        status: true,
        tasks: {
          where: { plannedDay: todayDay as "MON" | "TUE" | "WED" | "THU" | "FRI" },
          select: {
            id: true,
            title: true,
            status: true,
            comment: true,
            project: { select: { name: true } },
          },
        },
      },
    }),
    prisma.weekPlanner.findFirst({
      where: { userId, weekStartDate: nextMonday },
      select: { status: true },
    }),
    prisma.timeEntry.findMany({
      where: { userId, date: today },
      select: { hoursSpent: true },
    }),
  ]);

  const tasks: TodayTask[] = (currentPlanner?.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    projectName: t.project?.name ?? null,
    status: t.status,
    comment: t.comment,
  }));

  const hoursToday = timeEntries.reduce((s, te) => s + Number(te.hoursSpent), 0);

  return {
    tasks,
    weekPlannerStatus: (currentPlanner?.status ?? "NONE") as CollaboratorTodayData["weekPlannerStatus"],
    nextWeekPlannerStatus: (nextPlanner?.status ?? "NONE") as CollaboratorTodayData["nextWeekPlannerStatus"],
    hoursToday: Math.round(hoursToday * 10) / 10,
  };
}

// ─── Calcul des trends ──────────────────────────────────────────────────────

async function getTaskDoneRate(
  ctx: DashboardContext,
  range: PeriodRange,
  filters?: Partial<ActiveFilters>,
): Promise<number> {
  const where = getWeekPlannerTaskWhere(ctx, range, filters);
  const [done, total] = await Promise.all([
    prisma.weekPlannerTask.count({ where: { ...where, status: "DONE" } }),
    prisma.weekPlannerTask.count({ where }),
  ]);
  return percentage(done, total);
}

// ─── Assemblage par rôle ────────────────────────────────────────────────────

async function getAdminDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
  period: DashboardPeriod,
  filters: Partial<ActiveFilters>,
): Promise<DashboardData> {
  const prevRange = getPrevPeriodRange(period);

  const [
    taskGroups,
    projectRows,
    committeeRate,
    actionsToProcess,
    tableRows,
    recentActivity,
    alerts,
    budgetRiskData,
    committeeRows,
    upcomingMilestones,
    prevTaskRate,
    prevCommitteeRate,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range, filters),
    getProjectProgressRows(ctx, filters),
    getCommitteeCompletionRate(ctx, range, filters),
    countActionsToProcess(ctx),
    getAdminProjectRows(),
    getRecentActivity(ctx, range, filters),
    getSmartAlerts(ctx, filters),
    getAdminBudgetRiskData(),
    getAdminCommitteeRows(),
    getUpcomingMilestones(ctx, filters),
    getTaskDoneRate(ctx, prevRange, filters),
    getCommitteeCompletionRate(ctx, prevRange, filters),
  ]);

  const taskTotal = taskGroups.reduce((s, g) => s + g._count._all, 0);
  const taskDone = taskGroups.find((g) => g.status === "DONE")?._count._all ?? 0;
  const currentTaskRate = percentage(taskDone, taskTotal);

  const averageProjectProgress =
    projectRows.length > 0
      ? Math.round(
          projectRows.reduce((s, p) => s + getProjectProgress(p), 0) / projectRows.length,
        )
      : 0;

  const taskTrend = trendDelta(currentTaskRate, prevTaskRate);
  const committeeTrend = trendDelta(committeeRate, prevCommitteeRate);

  return {
    kpis: [
      {
        label: "Taux d'exécution global",
        value: `${currentTaskRate}%`,
        color: "blue",
        trend: { value: taskTrend, label: "vs période préc." },
        sub: `${taskDone} / ${taskTotal} tâches`,
      },
      {
        label: "Avancement moyen projets",
        value: `${averageProjectProgress}%`,
        color: "success",
        sub: `${projectRows.length} projet${projectRows.length > 1 ? "s" : ""} actif${projectRows.length > 1 ? "s" : ""}`,
      },
      {
        label: "Réalisation décisions",
        value: `${committeeRate}%`,
        color: "yellow",
        trend: { value: committeeTrend, label: "vs période préc." },
      },
      {
        label: "Actions à traiter",
        value: String(actionsToProcess),
        color: actionsToProcess > 0 ? "error" : "success",
        sub: actionsToProcess > 0 ? "Nécessite votre attention" : "Aucune action en attente",
      },
    ],
    barChartData: toBarChartItems(projectRows),
    pieChartData: toPieChartItems(taskGroups),
    recentActivity,
    tableRows,
    alerts,
    budgetRiskData,
    committeeRows,
    upcomingMilestones,
  };
}

async function getManagerDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
  period: DashboardPeriod,
  filters: Partial<ActiveFilters>,
): Promise<DashboardData> {
  const prevRange = getPrevPeriodRange(period);

  const [
    taskGroups,
    projectRows,
    committeeRate,
    actionsToProcess,
    tableRows,
    recentActivity,
    alerts,
    upcomingMilestones,
    todayTeamView,
    prevTaskRate,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range, filters),
    getProjectProgressRows(ctx, filters),
    getCommitteeCompletionRate(ctx, range, filters),
    countActionsToProcess(ctx),
    getManagerTeamRows(ctx.userId, filters.memberId),
    getRecentActivity(ctx, range, filters),
    getSmartAlerts(ctx, filters),
    getUpcomingMilestones(ctx, filters),
    getManagerTodayView(ctx.userId, filters.memberId),
    getTaskDoneRate(ctx, prevRange, filters),
  ]);

  const taskTotal = taskGroups.reduce((s, g) => s + g._count._all, 0);
  const taskDone = taskGroups.find((g) => g.status === "DONE")?._count._all ?? 0;
  const currentTaskRate = percentage(taskDone, taskTotal);
  const taskTrend = trendDelta(currentTaskRate, prevTaskRate);

  return {
    kpis: [
      {
        label: "Taux d'exécution équipe",
        value: `${currentTaskRate}%`,
        color: "blue",
        trend: { value: taskTrend, label: "vs période préc." },
        sub: `${taskDone} / ${taskTotal} tâches`,
      },
      {
        label: "Projets actifs périmètre",
        value: String(projectRows.length),
        color: "success",
      },
      {
        label: "Réalisation décisions",
        value: `${committeeRate}%`,
        color: "yellow",
      },
      {
        label: "Actions à traiter",
        value: String(actionsToProcess),
        color: actionsToProcess > 0 ? "error" : "success",
        sub: actionsToProcess > 0 ? "Nécessite votre attention" : "Tout est traité",
      },
    ],
    barChartData: toBarChartItems(projectRows),
    pieChartData: toPieChartItems(taskGroups),
    recentActivity,
    tableRows,
    alerts,
    upcomingMilestones,
    todayTeamView,
  };
}

async function getCollaboratorDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
  filters: Partial<ActiveFilters>,
): Promise<DashboardData> {
  const [
    taskGroups,
    projectRows,
    objectiveRate,
    nextMeeting,
    tableRows,
    recentActivity,
    alerts,
    collaboratorToday,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range, filters),
    getProjectProgressRows(ctx, filters),
    getObjectiveCompletionRate(ctx.userId, range),
    getNextMeetingLabel(ctx.userId),
    getCollaboratorKeyResultRows(ctx, range, filters.objectiveType),
    getRecentActivity(ctx, range, filters),
    getSmartAlerts(ctx, filters),
    getCollaboratorTodayData(ctx.userId),
  ]);

  const taskTotal = taskGroups.reduce((s, g) => s + g._count._all, 0);
  const taskDone = taskGroups.find((g) => g.status === "DONE")?._count._all ?? 0;

  return {
    kpis: [
      {
        label: "Mes tâches terminées",
        value: `${taskDone} / ${taskTotal}`,
        color: "blue",
        sub: taskTotal > 0 ? `${percentage(taskDone, taskTotal)}% de complétion` : undefined,
      },
      {
        label: "Complétion objectifs",
        value: `${objectiveRate}%`,
        color: "success",
      },
      {
        label: "Mes projets actifs",
        value: String(projectRows.length),
        color: "yellow",
      },
      {
        label: "Prochaine réunion",
        value: nextMeeting,
        color: "blue",
      },
    ],
    barChartData: toBarChartItems(projectRows),
    pieChartData: toPieChartItems(taskGroups),
    recentActivity,
    tableRows,
    alerts,
    collaboratorToday,
  };
}

export async function getDashboardData(params: {
  role: Role;
  userId: string;
  departmentId: string | null;
  period: DashboardPeriod;
  filters?: Partial<ActiveFilters>;
}): Promise<DashboardData> {
  const ctx: DashboardContext = {
    role: params.role,
    userId: params.userId,
    departmentId: params.departmentId,
  };
  const range = getPeriodRange(params.period);
  const filters = params.filters ?? {};

  if (ctx.role === "ADMIN") return getAdminDashboardData(ctx, range, params.period, filters);
  if (ctx.role === "MANAGER") return getManagerDashboardData(ctx, range, params.period, filters);
  return getCollaboratorDashboardData(ctx, range, filters);
}

export async function getEtpData(period: DashboardPeriod): Promise<{
  entries: EtpEntry[];
  teamCharges: TeamCharge[];
  periodLabel: string;
}> {
  const { startDate, endDate, workingDays, label } = getPeriodRange(period);

  const [rawEntries, teams] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: startDate, lte: endDate }, user: { isActive: true } },
      select: {
        id: true,
        userId: true,
        hoursSpent: true,
        activityLabel: true,
        date: true,
        user: {
          select: {
            fullName: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
                subDepartment: { select: { department: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        subDepartment: { select: { department: { select: { name: true } } } },
        members: {
          where: { isActive: true, role: { in: ["COLLABORATOR", "INTERN"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  const entries: EtpEntry[] = rawEntries.map((te) => {
    const parts = te.user.fullName.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : te.user.fullName.slice(0, 2).toUpperCase();

    return {
      id: te.id,
      collaboratorName: te.user.fullName,
      initials,
      department: te.user.team?.subDepartment?.department?.name ?? "—",
      team: te.user.team?.name ?? "—",
      activityLabel: te.activityLabel,
      hoursSpent: Number(te.hoursSpent),
      date: te.date.toISOString().split("T")[0],
    };
  });

  const teamCharges: TeamCharge[] = teams
    .filter((t) => t.members.length > 0)
    .map((t) => {
      const consumedHours = rawEntries
        .filter((te) => te.user.teamId === t.id)
        .reduce((s, te) => s + Number(te.hoursSpent), 0);
      return {
        team: t.name,
        department: t.subDepartment?.department?.name ?? "—",
        consumedHours: Math.round(consumedHours * 10) / 10,
        availableHours: t.members.length * 8 * workingDays,
      };
    });

  return { entries, teamCharges, periodLabel: label };
}
