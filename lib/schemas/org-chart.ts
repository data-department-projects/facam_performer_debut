import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  parentDepartmentId: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  parentDepartmentId: z.string().nullable().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const createSubDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  departmentId: z.string().min(1, "Le département est requis"),
});

export const updateSubDepartmentSchema = createSubDepartmentSchema.omit({ departmentId: true });

export type CreateSubDepartmentInput = z.infer<typeof createSubDepartmentSchema>;
export type UpdateSubDepartmentInput = z.infer<typeof updateSubDepartmentSchema>;

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  subDepartmentId: z.string().min(1, "Le sous-département est requis"),
  managerId: z.string().min(1, "Le responsable est requis"),
});

export const updateTeamSchema = createTeamSchema.omit({ subDepartmentId: true });

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
