import { z } from "zod";

export const createObjectiveSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().default(""),
  type: z.enum(["PERFORMANCE", "SKILLS_DEVELOPMENT"]),
  risks: z.array(z.string()).default([]),
  periodStart: z.string().min(1, "La date de début est requise"),
  periodEnd: z.string().min(1, "La date de fin est requise"),
});

export const updateObjectiveSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["PERFORMANCE", "SKILLS_DEVELOPMENT"]).optional(),
  risks: z.array(z.string()).optional(),
  periodStart: z.string().min(1).optional(),
  periodEnd: z.string().min(1).optional(),
});

export const addKeyResultSchema = z.object({
  objectiveId: z.string().min(1),
  description: z.string().min(1, "La description est requise"),
  targetValue: z.number().min(1).nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateKeyResultProgressSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE"]),
  currentValue: z.number().min(0).nullable().optional(),
  evidenceNote: z.string().nullable().optional(),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type AddKeyResultInput = z.infer<typeof addKeyResultSchema>;
export type UpdateKeyResultProgressInput = z.infer<typeof updateKeyResultProgressSchema>;
