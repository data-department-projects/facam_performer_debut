import { z } from "zod";

export const createPlannerSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : YYYY-MM-DD"),
});

export const addTaskSchema = z.object({
  plannerId: z.string().uuid(),
  title: z.string().min(1, "Le titre est obligatoire").max(255),
  plannedDay: z.enum(["MON", "TUE", "WED", "THU", "FRI"]),
  projectId: z.string().uuid().nullable().optional(),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export const submitPlannerSchema = z.object({
  plannerId: z.string().uuid(),
});

export const validatePlannerSchema = z.object({
  plannerId: z.string().uuid(),
});

export const updateTaskExecutionSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["STARTED", "IN_PROGRESS", "DONE", "NOT_DONE"]),
  hoursSpent: z.number().min(0).max(24),
  comment: z.string(),
}).refine(
  (data) => data.status !== "NOT_DONE" || data.comment.trim().length > 0,
  { message: "Un commentaire est obligatoire quand le statut est 'Non terminé'", path: ["comment"] },
);

export type CreatePlannerInput = z.infer<typeof createPlannerSchema>;
export type AddTaskInput = z.infer<typeof addTaskSchema>;
