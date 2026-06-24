import { z } from "zod";

export const bugReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "La description doit contenir au moins 10 caractères.")
    .max(2000, "La description ne peut pas dépasser 2000 caractères."),
});

export type BugReportInput = z.infer<typeof bugReportSchema>;
