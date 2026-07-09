import { z } from "zod";

export const createAssignedTaskSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères").max(200),
  description: z.string().max(2000).optional(),
  assigneeIds: z.array(z.string().min(1)).default([]),
});

export const updateAssignedTaskSchema = createAssignedTaskSchema;

export type CreateAssignedTaskInput = z.infer<typeof createAssignedTaskSchema>;
export type UpdateAssignedTaskInput = z.infer<typeof updateAssignedTaskSchema>;
