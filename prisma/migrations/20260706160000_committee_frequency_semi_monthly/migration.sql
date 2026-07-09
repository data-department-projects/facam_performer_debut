-- AlterEnum: distingue "tous les 15 jours" (SEMI_MONTHLY) de "tous les 2 mois" (BIMONTHLY),
-- l'ancien libelle unique "Bimensuel" etant ambigu entre les deux.
ALTER TYPE "CommitteeFrequency" ADD VALUE 'SEMI_MONTHLY';
