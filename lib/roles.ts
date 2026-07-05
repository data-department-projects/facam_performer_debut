import type { Role } from "@/app/generated/prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};
