"use server";

import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { OTP_LENGTH, OTP_EXPIRATION_MINUTES } from "@/lib/constants";

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true },
    });

    // Plateforme interne fermée — on peut signaler qu'un email est inconnu
    if (!user) {
      return { success: false, error: "Aucun compte ne correspond à cette adresse email." };
    }

    // Invalider tous les codes précédents non utilisés
    await prisma.passwordResetOtp.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Générer un code à 6 chiffres
    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
    );

    await prisma.passwordResetOtp.create({
      data: { userId: user.id, code, expiresAt },
    });

    await sendEmail({
      to: email,
      template: "otp-reset",
      data: { name: user.fullName, code, expiresIn: String(OTP_EXPIRATION_MINUTES) },
    });

    return { success: true };
  } catch (error) {
    console.error("[actions/auth] requestPasswordReset", error);
    return { success: false, error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function checkOtpValid(
  email: string,
  code: string,
): Promise<{ valid: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return { valid: false };

    const otp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gt: new Date() } },
    });

    return { valid: !!otp };
  } catch {
    return { valid: false };
  }
}

export async function verifyOtpAndResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "Code invalide ou expiré." };
    }

    const otp = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return { success: false, error: "Code invalide ou expiré." };
    }

    const passwordHash = await hashPassword(newPassword);

    // Transaction : mettre à jour le mot de passe + marquer le code comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("[actions/auth] verifyOtpAndResetPassword", error);
    return { success: false, error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
