import { z } from "zod";

const facamEmail = z
  .string()
  .min(1, "L'email est requis")
  .regex(
    /^[a-z]+\.[a-z]+@facamstairway\.com$/i,
    "L'email doit être au format prenom.nom@facamstairway.com",
  );

export const loginSchema = z.object({
  email: facamEmail,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const requestOtpSchema = z.object({
  email: facamEmail,
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z
  .object({
    email: facamEmail,
    code: z
      .string()
      .length(6, "Le code doit contenir 6 chiffres")
      .regex(/^\d{6}$/, "Le code ne doit contenir que des chiffres"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
