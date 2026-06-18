export const ROLES = ["ADMIN", "MANAGER", "COLLABORATOR"] as const;

export const TASK_STATUSES = ["STARTED", "IN_PROGRESS", "DONE", "NOT_DONE"] as const;
export const COMMENT_REQUIRED_STATUS = "NOT_DONE"; // Règle 12
export const WEEK_PLANNER_LOCK_ON_VALIDATE = true; // Règle 8

export const OTP_LENGTH = 6;
export const OTP_EXPIRATION_MINUTES = 10;
export const GENERATED_PASSWORD_LENGTH = 12;

export const DAILY_REMINDER_CRON = "0 8 * * 1-5";
export const WEEKLY_REMINDER_CRON = "0 15 * * 5";
export const MEETING_REMINDER_CRON = "0 * * * *";
export const MEETING_REMINDER_WINDOW_HOURS = 24;

export const OBJECTIVE_TYPES = ["PERFORMANCE", "SKILLS_DEVELOPMENT"] as const;
export const KEY_RESULT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;
export const OBJECTIVE_FREQUENCIES = ["ANNUAL", "QUARTERLY", "MONTHLY"] as const;

export const WEEK_PLANNER_STATUSES = ["DRAFT", "SUBMITTED", "VALIDATED"] as const;

export const PLANNED_DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;

export const PROJECT_CATEGORIES = [
  "RESEARCH_DEVELOPMENT",
  "INFRASTRUCTURE",
  "CLIENT",
  "INTERNAL_TRANSFORMATION",
  "MARKETING",
  "OTHER",
] as const;

export const STRATEGIC_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL_REGULATORY",
] as const;

export const PROJECT_STATUSES = [
  "PENDING",
  "INITIATED",
  "IN_PROGRESS",
  "PAUSED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const COMMITTEE_FREQUENCIES = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "AD_HOC",
] as const;

export const ATTACHMENT_RELATED_TYPES = [
  "PROJECT_TASK",
  "WEEK_PLANNER_TASK",
  "COMMITTEE_ACTION",
  "KEY_RESULT",
] as const;

export const BCRYPT_SALT_ROUNDS = 12;

export const S3_SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export const PROJECT_CODE_PREFIX = "PRJ";

export const NOTIFICATION_CONSENT = {
  NOT_ASKED: "NOT_ASKED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
