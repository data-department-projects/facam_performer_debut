import { z } from "zod";

export const ganttTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Le titre est requis")
      .max(200, "Le titre ne peut pas dépasser 200 caractères"),
    startDate: z.string().min(1, "La date de début est requise"),
    endDate: z.string().min(1, "La date de fin est requise"),
    responsibleUserId: z.string().min(1, "Le responsable est requis"),
    dependsOnIds: z.array(z.string()).default([]),
    progressPercent: z.coerce.number().int().min(0).max(100).default(0),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });

export type GanttTaskInput = z.infer<typeof ganttTaskSchema>;
