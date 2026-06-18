import { z } from "zod";

const ROLES = ["ADMIN", "MANAGER", "COLLABORATOR"] as const;

const facamEmail = z
  .string()
  .min(1, "L'email est requis")
  .regex(
    /^[a-z]+(?:-[a-z]+)*\.(?:[a-z]+(?:-[a-z]+)*)@facamstairway\.com$/i,
    "L'email doit être au format prenom.nom@facamstairway.com",
  );

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères")
    .max(100),
  email: facamEmail,
  role: z.enum(ROLES),
  departmentId: z.string().min(1, "Le département est requis"),
  teamId: z.string().optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères")
    .max(100),
  email: facamEmail,
  role: z.enum(ROLES),
  departmentId: z.string().min(1, "Le département est requis"),
  teamId: z.string().optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .optional()
    .or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
