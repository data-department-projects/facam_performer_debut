export type ObjectiveType = "PERFORMANCE" | "SKILLS_DEVELOPMENT";
export type KeyResultStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type KeyResultWithCert = {
  id: string;
  description: string;
  targetValue: number | null;
  currentValue: number | null;
  evidenceNote: string | null;
  dueDate: string | null;
  status: KeyResultStatus;
  certificateUrl: string | null;
};

export type ObjectiveWithKeyResults = {
  id: string;
  userId: string;
  userName: string;
  name: string;
  description: string;
  type: ObjectiveType;
  risks: string[];
  periodStart: string;
  periodEnd: string;
  keyResults: KeyResultWithCert[];
};

export type DepartmentGroup = {
  id: string;
  name: string;
  totalKRs: number;
  doneKRs: number;
  progressPercent: number;
  objectives: ObjectiveWithKeyResults[];
};
