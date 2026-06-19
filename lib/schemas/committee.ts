import { z } from "zod";

export const createCommitteeSchema = z.object({
  name: z.string().min(1, "Le nom du comité est requis"),
  responsibleUserId: z.string().min(1, "Le responsable est requis"),
  objectives: z.string().min(1, "Les objectifs sont requis"),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"], {
    error: "Sélectionner une fréquence",
  }),
  departmentIds: z.array(z.string().min(1)).min(1, "Sélectionner au moins un département"),
  participantIds: z.array(z.string().min(1)).default([]),
  guestIds: z.array(z.string().min(1)).default([]),
});

export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;

export const planMeetingSchema = z.object({
  committeeId: z.string().min(1, "L'identifiant du comité est requis"),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
  meetingLink: z.string().url("URL invalide").optional().or(z.literal("")),
});

export type PlanMeetingInput = z.infer<typeof planMeetingSchema>;

export const createCommitteeActionSchema = z.object({
  meetingId: z.string().min(1, "L'identifiant de la réunion est requis"),
  title: z.string().min(1, "Le titre de la décision est requis"),
  responsibleUserId: z.string().min(1, "Le responsable est requis"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  status: z.enum(["PENDING", "DONE"]).default("PENDING"),
});

export type CreateCommitteeActionInput = z.infer<typeof createCommitteeActionSchema>;
