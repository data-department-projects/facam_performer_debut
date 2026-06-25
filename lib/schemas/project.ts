import { z } from "zod";

export const PROJECT_MEMBER_ROLES = [
  "Chef de Projet Adjoint",
  "Expert Métier",
  "Contributeur",
  "Chargé de Communication",
  "Contrôleur",
  "Observateur",
] as const;

export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

export const projectSchema = z
  .object({
    // 1 — Identité
    name: z.string().min(3, "Le nom du projet est requis (min. 3 caractères)"),
    description: z.string().min(10, "La description est requise (min. 10 caractères)"),
    category: z.enum(
      ["RESEARCH_DEVELOPMENT", "INFRASTRUCTURE", "CLIENT", "INTERNAL_TRANSFORMATION", "MARKETING", "OTHER"],
      { error: "Sélectionner une catégorie" },
    ),
    categoryOther: z.string().optional(),
    strategicPriority: z.enum(
      ["LOW", "MEDIUM", "HIGH", "CRITICAL_REGULATORY"],
      { error: "Sélectionner une priorité" },
    ),

    // 2 — Gouvernance
    sponsorUserId: z.string().optional(),
    projectManagerId: z.string().min(1, "Le chef de projet est requis"),
    beneficiaryType: z.enum(["INTERNAL", "EXTERNAL"]).default("INTERNAL"),
    beneficiaryDepartmentId: z.string().optional(),
    beneficiaryExternalName: z.string().optional(),
    teamMembers: z
      .array(
        z.object({
          userId: z.string().min(1),
          roleLabel: z.string().min(1, "Sélectionner un rôle"),
        }),
      )
      .optional()
      .default([]),

    // 3 — Cadrage temporel
    estimatedStartDate: z.string().min(1, "La date de début estimée est requise"),
    targetEndDate: z.string().min(1, "L'échéance cible est requise"),
    actualStartDate: z.string().optional(),
    actualEndDate: z.string().optional(),

    // 4 — Financier
    initialBudget: z.coerce
      .number({ error: "Saisir un montant valide" })
      .min(0, "Le budget ne peut pas être négatif"),

    // 5 — Spécifications
    scopeIncluded: z.string().optional().default(""),
    scopeExcluded: z.string().optional().default(""),
    expectedDeliverables: z.array(z.object({ value: z.string().min(1) })).optional().default([]),
    successCriteria: z.array(z.object({ value: z.string().min(1) })).optional().default([]),
    documentationLinks: z.array(z.object({ value: z.string().url("URL invalide") })).optional().default([]),
  })
  .refine(
    (data) => data.category !== "OTHER" || (data.categoryOther?.trim() ?? "") !== "",
    { message: "Précisez la catégorie", path: ["categoryOther"] },
  );

export type ProjectInput = z.infer<typeof projectSchema>;

export const PROJECT_EXPENSE_TYPES = [
  { value: "ONE_TIME", label: "Unique" },
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "ANNUAL", label: "Annuelle" },
] as const;

export const EXPENSE_CATEGORIES = [
  "Ressources humaines",
  "Matériel et équipements",
  "Logiciels et licences",
  "Prestations externes",
  "Déplacements et missions",
  "Communication et marketing",
  "Formation",
  "Réunions et événements",
  "Frais administratifs",
  "Maintenance et support",
  "Autres dépenses",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const projectExpenseSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  amount: z.coerce.number({ error: "Saisir un montant valide" }).min(0.01, "Le montant doit être supérieur à 0"),
  expenseType: z.enum(["ONE_TIME", "MONTHLY", "ANNUAL"], { error: "Sélectionner un type" }),
  expenseCategory: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
});

export type ProjectExpenseInput = z.infer<typeof projectExpenseSchema>;
