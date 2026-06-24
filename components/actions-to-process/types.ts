export type PendingProject = {
  id: string;
  code: string;
  name: string;
  category: string;
  strategicPriority: string;
  managerName: string;
  createdAt: string;
};

export type PendingWeekPlanner = {
  id: string;
  collaboratorName: string;
  weekStartDate: string;
  weekEndDate: string;
  taskCount: number;
  submittedAt: string;
};

export type OverdueCommitteeAction = {
  id: string;
  title: string;
  committeeName: string;
  responsibleName: string;
  dueDate: string;
  overdueDays: number;
};

export type ActionsToProcessData = {
  pendingProjects: PendingProject[];
  pendingWeekPlanners: PendingWeekPlanner[];
  overdueActions: OverdueCommitteeAction[];
};
