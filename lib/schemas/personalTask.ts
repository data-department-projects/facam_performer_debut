import { z } from "zod";

export const createPersonalTaskSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères").max(200),
  description: z.string().max(2000).optional(),
});

export const updatePersonalTaskSchema = createPersonalTaskSchema;

export type CreatePersonalTaskInput = z.infer<typeof createPersonalTaskSchema>;
export type UpdatePersonalTaskInput = z.infer<typeof updatePersonalTaskSchema>;
