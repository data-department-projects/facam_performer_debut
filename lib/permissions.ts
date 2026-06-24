import { auth } from "@/lib/auth";
import type { Role } from "@/app/generated/prisma/client";

export async function requireRole(allowed: Role[]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Non authentifié");
  }

  if (!allowed.includes(session.user.role as Role)) {
    throw new Error("Accès non autorisé");
  }

  return session.user;
}

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
