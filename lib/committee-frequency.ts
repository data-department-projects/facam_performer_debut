import type { CommitteeFrequency } from "@/app/generated/prisma/client";

export const FREQUENCY_LABELS: Record<CommitteeFrequency, string> = {
  WEEKLY: "Hebdomadaire",
  SEMI_MONTHLY: "Bimensuel (tous les 15 jours)",
  BIMONTHLY: "Bimensuel (tous les 2 mois)",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  AD_HOC: "Ponctuel",
};

export const FREQUENCY_OPTIONS: { value: CommitteeFrequency; label: string }[] = (
  Object.entries(FREQUENCY_LABELS) as [CommitteeFrequency, string][]
).map(([value, label]) => ({ value, label }));
