export type PlannedDay = "MON" | "TUE" | "WED" | "THU" | "FRI";
export type TaskStatus = "STARTED" | "IN_PROGRESS" | "DONE" | "NOT_DONE";
export type PlannerStatus = "DRAFT" | "SUBMITTED" | "VALIDATED";

export type WeekTask = {
  id: string;
  title: string;
  plannedDay: PlannedDay;
  status: TaskStatus;
  comment: string | null;
  isLocked: boolean;
  project: { id: string; name: string; code: string } | null;
};

export type ConfirmedProject = { id: string; name: string; code: string };

export type WeekPlannerData = {
  id: string;
  weekStartDate: Date;
  status: PlannerStatus;
  tasks: WeekTask[];
};

export type TeamMember = {
  id: string;
  fullName: string;
  initials: string;
  weekPlanner: {
    id: string;
    status: PlannerStatus;
    weekStartDate: string;
  };
};

// Aliases de compatibilité (anciens noms utilisés dans certains composants)
export type MockWeekTask = WeekTask;
export type MockProject = ConfirmedProject;
export type MockMember = TeamMember;
