import { auth } from "@/lib/auth";
import type { Prisma, Role } from "@/app/generated/prisma/client";

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

// Prédicat "collaborateurs/stagiaires du département de ce Manager" — source de vérité
// unique pour le scope Manager, remplace l'ancienne relation Team (non peuplée en
// pratique). N'exclut pas les comptes désactivés : un enregistrement (WeekPlanner, etc.)
// déjà créé reste à traiter même si son auteur a quitté depuis. Retourne un filtre qui ne
// matche jamais si departmentId est absent, plutôt que de laisser tomber silencieusement
// la contrainte (Prisma ignore les valeurs `undefined` dans un where).
export function departmentMemberWhere(
  departmentId: string | null | undefined,
): Prisma.UserWhereInput {
  if (!departmentId) return { id: "__no_department__" };
  return { departmentId, role: { in: ["COLLABORATOR", "INTERN"] } };
}

// Variante "roster actuel" — pour lister les membres d'équipe en cours (filtre
// désactivé), ex. dropdown de filtre du dashboard, rappel hebdomadaire.
export function activeDepartmentMembersWhere(
  departmentId: string | null | undefined,
): Prisma.UserWhereInput {
  return { ...departmentMemberWhere(departmentId), isActive: true };
}
