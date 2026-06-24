import type { Prisma, ProjectStatus, Role, TaskStatus } from "@/app/generated/prisma/client";
import type {
  ActivityItem,
  AdminProjectRow,
  BarChartItem,
  CollaboratorKeyResultRow,
  DashboardData,
  DashboardPeriod,
  ManagerTeamRow,
  PieChartItem,
} from "@/components/dashboard/types";
import { prisma } from "@/lib/prisma";

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

function formatIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function percentage(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getWeekPlannerScope(
  ctx: DashboardContext,
): Prisma.WeekPlannerWhereInput {
  if (ctx.role === "ADMIN") return {};

  if (ctx.role === "MANAGER") {
    return { user: { team: { managerId: ctx.userId } } };
  }

  return { userId: ctx.userId };
}

function getWeekPlannerTaskWhere(
  ctx: DashboardContext,
  range: PeriodRange,
): Prisma.WeekPlannerTaskWhereInput {
  return {
    weekPlanner: {
      weekStartDate: { gte: range.startDate, lte: range.endDate },
      ...getWeekPlannerScope(ctx),
    },
  };
}

function getConfirmedActiveProjectWhere(
  ctx: DashboardContext,
): Prisma.ProjectWhereInput {
  const base: Prisma.ProjectWhereInput = {
    isConfirmed: true,
    currentStatus: { in: ACTIVE_PROJECT_STATUSES },
  };

  if (ctx.role === "ADMIN") return base;

  if (ctx.role === "MANAGER") {
    if (!ctx.departmentId) return { id: "__no_department__" };

    return {
      AND: [
        base,
        {
          OR: [
            { projectManagerId: ctx.userId },
            { beneficiaryDepartmentId: ctx.departmentId },
            { teamMembers: { some: { user: { departmentId: ctx.departmentId } } } },
          ],
        },
      ],
    };
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
): Prisma.CommitteeActionWhereInput {
  if (ctx.role === "ADMIN") return {};

  if (ctx.role === "MANAGER") {
    return ctx.departmentId
      ? { responsible: { departmentId: ctx.departmentId } }
      : { id: "__no_department__" };
  }

  return { responsibleUserId: ctx.userId };
}

function getProjectProgress(project: ProjectWithProgress): number {
  if (project.ganttTasks.length === 0) return 0;

  const total = project.ganttTasks.reduce(
    (sum, task) => sum + task.progressPercent,
    0,
  );
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
): Promise<ProjectWithProgress[]> {
  return prisma.project.findMany({
    where: getConfirmedActiveProjectWhere(ctx),
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
): Promise<{ status: TaskStatus; _count: { _all: number } }[]> {
  const baseWhere = getWeekPlannerTaskWhere(ctx, range);
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
    const [pendingProjects, submittedPlanners, overdueActions] =
      await Promise.all([
        prisma.project.count({ where: { isConfirmed: false } }),
        prisma.weekPlanner.count({ where: { status: "SUBMITTED" } }),
        prisma.committeeAction.count({
          where: { status: "PENDING", dueDate: { lt: today } },
        }),
      ]);

    return pendingProjects + submittedPlanners + overdueActions;
  }

  if (ctx.role === "MANAGER") {
    const [submittedPlanners, overdueActions] = await Promise.all([
      prisma.weekPlanner.count({
        where: {
          status: "SUBMITTED",
          user: { team: { managerId: ctx.userId } },
        },
      }),
      prisma.committeeAction.count({
        where: {
          status: "PENDING",
          dueDate: { lt: today },
          ...getCommitteeActionScope(ctx),
        },
      }),
    ]);

    return submittedPlanners + overdueActions;
  }

  return prisma.committeeAction.count({
    where: {
      status: "PENDING",
      dueDate: { lt: today },
      responsibleUserId: ctx.userId,
    },
  });
}

async function getCommitteeCompletionRate(
  ctx: DashboardContext,
  range: PeriodRange,
): Promise<number> {
  const groups = await prisma.committeeAction.groupBy({
    by: ["status"],
    where: {
      dueDate: { gte: range.startDate, lte: range.endDate },
      ...getCommitteeActionScope(ctx),
    },
    _count: { _all: true },
  });

  const total = groups.reduce((sum, group) => sum + group._count._all, 0);
  const done = groups.find((group) => group.status === "DONE")?._count._all ?? 0;

  return percentage(done, total);
}

async function getObjectiveCompletionRate(
  userId: string,
  range: PeriodRange,
): Promise<number> {
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

  const total = groups.reduce((sum, group) => sum + group._count._all, 0);
  const done = groups.find((group) => group.status === "DONE")?._count._all ?? 0;

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

  return projects.map((project) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    managerName: project.projectManager.fullName,
    createdAt: formatIsoDate(project.createdAt) ?? "",
    strategicPriority: project.strategicPriority,
  }));
}

async function getManagerTeamRows(userId: string): Promise<ManagerTeamRow[]> {
  const weekRange = getPeriodRange("week");
  const collaborators = await prisma.user.findMany({
    where: {
      isActive: true,
      role: "COLLABORATOR",
      team: { managerId: userId },
    },
    select: {
      id: true,
      fullName: true,
      weekPlanners: {
        where: { weekStartDate: weekRange.startDate },
        select: {
          status: true,
          tasks: { select: { status: true } },
        },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  return collaborators.map((collaborator) => {
    const planner = collaborator.weekPlanners[0];
    const tasks = planner?.tasks ?? [];
    const doneTasks = tasks.filter((task) => task.status === "DONE").length;

    return {
      id: collaborator.id,
      collaboratorName: collaborator.fullName,
      weekStatus: planner?.status ?? "NONE",
      totalTasks: tasks.length,
      doneTasks,
    };
  });
}

async function getCollaboratorKeyResultRows(
  ctx: DashboardContext,
  range: PeriodRange,
): Promise<CollaboratorKeyResultRow[]> {
  const rows = await prisma.keyResult.findMany({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      objective: {
        userId: ctx.userId,
        periodStart: { lte: range.endDate },
        periodEnd: { gte: range.startDate },
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

  return rows.map((row) => ({
    id: row.id,
    objectiveName: row.objective.name,
    description: row.description,
    targetValue: row.targetValue === null ? null : Number(row.targetValue),
    currentValue: row.currentValue === null ? null : Number(row.currentValue),
    status: row.status,
    dueDate: formatIsoDate(row.dueDate),
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
): Promise<ActivityItem[]> {
  const projectWhere = getConfirmedActiveProjectWhere(ctx);
  const weekPlannerScope = getWeekPlannerScope(ctx);
  const committeeScope = getCommitteeActionScope(ctx);
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
      where: {
        ...projectWhere,
        createdAt: { gte: range.startDate, lt: range.endExclusiveDate },
      },
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
      where: {
        ...weekPlannerScope,
        createdAt: { gte: range.startDate, lt: range.endExclusiveDate },
      },
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
      where: {
        ...committeeScope,
        createdAt: { gte: range.startDate, lt: range.endExclusiveDate },
      },
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
      where: {
        ...keyResultScope,
        updatedAt: { gte: range.startDate, lt: range.endExclusiveDate },
      },
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
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      type: "project" as const,
      description: `Projet « ${project.name} » créé`,
      actor: project.projectManager.fullName,
      timestamp: project.createdAt.toISOString(),
    })),
    ...planners.map((planner) => ({
      id: `week-planner-${planner.id}`,
      type: "week-planner" as const,
      description: `Semaine du ${formatIsoDate(planner.weekStartDate)} au ${formatIsoDate(planner.weekEndDate)} planifiée`,
      actor: planner.user.fullName,
      timestamp: planner.createdAt.toISOString(),
    })),
    ...actions.map((action) => ({
      id: `committee-${action.id}`,
      type: "committee" as const,
      description: `Action « ${action.title} » créée`,
      actor: action.responsible.fullName,
      timestamp: action.createdAt.toISOString(),
    })),
    ...keyResults.map((keyResult) => ({
      id: `objective-${keyResult.id}`,
      type: "objective" as const,
      description: `Résultat clé « ${keyResult.description} » mis à jour`,
      actor: keyResult.objective.user.fullName,
      timestamp: keyResult.updatedAt.toISOString(),
    })),
  ];

  return activity
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 5);
}

async function getAdminDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
): Promise<DashboardData> {
  const [
    taskGroups,
    projectRows,
    committeeRate,
    actionsToProcess,
    tableRows,
    recentActivity,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range),
    getProjectProgressRows(ctx),
    getCommitteeCompletionRate(ctx, range),
    countActionsToProcess(ctx),
    getAdminProjectRows(),
    getRecentActivity(ctx, range),
  ]);

  const taskTotal = taskGroups.reduce((sum, group) => sum + group._count._all, 0);
  const taskDone = taskGroups.find((group) => group.status === "DONE")?._count._all ?? 0;
  const averageProjectProgress =
    projectRows.length > 0
      ? Math.round(
          projectRows.reduce(
            (sum, project) => sum + getProjectProgress(project),
            0,
          ) / projectRows.length,
        )
      : 0;

  return {
    kpis: [
      {
        label: "Taux d'exécution global",
        value: `${percentage(taskDone, taskTotal)}%`,
        color: "blue",
      },
      {
        label: "Avancement moyen des projets",
        value: `${averageProjectProgress}%`,
        color: "success",
      },
      {
        label: "Réalisation décisions comités",
        value: `${committeeRate}%`,
        color: "yellow",
      },
      {
        label: "Actions à traiter",
        value: String(actionsToProcess),
        color: actionsToProcess > 0 ? "error" : "success",
      },
    ],
    barChartData: toBarChartItems(projectRows),
    pieChartData: toPieChartItems(taskGroups),
    recentActivity,
    tableRows,
  };
}

async function getManagerDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
): Promise<DashboardData> {
  const [
    taskGroups,
    projectRows,
    committeeRate,
    actionsToProcess,
    tableRows,
    recentActivity,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range),
    getProjectProgressRows(ctx),
    getCommitteeCompletionRate(ctx, range),
    countActionsToProcess(ctx),
    getManagerTeamRows(ctx.userId),
    getRecentActivity(ctx, range),
  ]);

  const taskTotal = taskGroups.reduce((sum, group) => sum + group._count._all, 0);
  const taskDone = taskGroups.find((group) => group.status === "DONE")?._count._all ?? 0;

  return {
    kpis: [
      {
        label: "Taux d'exécution équipe",
        value: `${percentage(taskDone, taskTotal)}%`,
        color: "blue",
      },
      {
        label: "Projets actifs périmètre",
        value: String(projectRows.length),
        color: "success",
      },
      {
        label: "Réalisation décisions comités",
        value: `${committeeRate}%`,
        color: "yellow",
      },
      {
        label: "Actions à traiter",
        value: String(actionsToProcess),
        color: actionsToProcess > 0 ? "error" : "success",
      },
    ],
    barChartData: toBarChartItems(projectRows),
    pieChartData: toPieChartItems(taskGroups),
    recentActivity,
    tableRows,
  };
}

async function getCollaboratorDashboardData(
  ctx: DashboardContext,
  range: PeriodRange,
): Promise<DashboardData> {
  const [
    taskGroups,
    projectRows,
    objectiveRate,
    nextMeeting,
    tableRows,
    recentActivity,
  ] = await Promise.all([
    getTaskStatusGroups(ctx, range),
    getProjectProgressRows(ctx),
    getObjectiveCompletionRate(ctx.userId, range),
    getNextMeetingLabel(ctx.userId),
    getCollaboratorKeyResultRows(ctx, range),
    getRecentActivity(ctx, range),
  ]);

  const taskTotal = taskGroups.reduce((sum, group) => sum + group._count._all, 0);
  const taskDone = taskGroups.find((group) => group.status === "DONE")?._count._all ?? 0;

  return {
    kpis: [
      {
        label: "Mes tâches DONE",
        value: `${taskDone} / ${taskTotal}`,
        color: "blue",
      },
      {
        label: "% complétion objectifs",
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
  };
}

export async function getDashboardData(params: {
  role: Role;
  userId: string;
  departmentId: string | null;
  period: DashboardPeriod;
}): Promise<DashboardData> {
  const ctx: DashboardContext = {
    role: params.role,
    userId: params.userId,
    departmentId: params.departmentId,
  };
  const range = getPeriodRange(params.period);

  if (ctx.role === "ADMIN") return getAdminDashboardData(ctx, range);
  if (ctx.role === "MANAGER") return getManagerDashboardData(ctx, range);

  return getCollaboratorDashboardData(ctx, range);
}

export async function getEtpData(period: DashboardPeriod): Promise<{
  entries: EtpEntry[];
  teamCharges: TeamCharge[];
  periodLabel: string;
}> {
  const { startDate, endDate, workingDays, label } = getPeriodRange(period);

  const [rawEntries, teams] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        user: { isActive: true },
      },
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
                subDepartment: {
                  select: { department: { select: { name: true } } },
                },
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
        subDepartment: {
          select: { department: { select: { name: true } } },
        },
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
        .reduce((sum, te) => sum + Number(te.hoursSpent), 0);

      return {
        team: t.name,
        department: t.subDepartment?.department?.name ?? "—",
        consumedHours: Math.round(consumedHours * 10) / 10,
        availableHours: t.members.length * 8 * workingDays,
      };
    });

  return { entries, teamCharges, periodLabel: label };
}
