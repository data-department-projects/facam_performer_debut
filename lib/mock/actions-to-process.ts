import type { ActionsToProcessData } from "@/components/actions-to-process/types";

export const MOCK_ACTIONS_TO_PROCESS: ActionsToProcessData = {
  pendingProjects: [
    {
      id: "mock-proj-1",
      code: "PRJ-2026-007",
      name: "Refonte du portail fournisseurs",
      category: "Transformation digitale",
      strategicPriority: "Haute",
      managerName: "Armand Koné",
      createdAt: "2026-06-10",
    },
    {
      id: "mock-proj-2",
      code: "PRJ-2026-008",
      name: "Déploiement ERP phase 2",
      category: "Infrastructure SI",
      strategicPriority: "Critique",
      managerName: "Fatou Diallo",
      createdAt: "2026-06-14",
    },
    {
      id: "mock-proj-3",
      code: "PRJ-2026-009",
      name: "Programme de formation managériale",
      category: "Développement RH",
      strategicPriority: "Moyenne",
      managerName: "Ismaël Traoré",
      createdAt: "2026-06-18",
    },
  ],

  pendingWeekPlanners: [
    {
      id: "mock-wp-1",
      collaboratorName: "Brice Ouédraogo",
      weekStartDate: "2026-06-16",
      weekEndDate: "2026-06-20",
      taskCount: 8,
      submittedAt: "2026-06-16",
    },
    {
      id: "mock-wp-2",
      collaboratorName: "Awa Sanogo",
      weekStartDate: "2026-06-16",
      weekEndDate: "2026-06-20",
      taskCount: 5,
      submittedAt: "2026-06-17",
    },
    {
      id: "mock-wp-3",
      collaboratorName: "Narcisse Yoda",
      weekStartDate: "2026-06-23",
      weekEndDate: "2026-06-27",
      taskCount: 7,
      submittedAt: "2026-06-23",
    },
  ],

  overdueActions: [
    {
      id: "mock-ca-1",
      title: "Finaliser le cahier des charges du nouveau CRM",
      committeeName: "Comité de pilotage SI",
      responsibleName: "Armand Koné",
      dueDate: "2026-06-10",
      overdueDays: 13,
    },
    {
      id: "mock-ca-2",
      title: "Soumettre le rapport d'audit RH Q2",
      committeeName: "Comité de Direction",
      responsibleName: "Fatou Diallo",
      dueDate: "2026-06-15",
      overdueDays: 8,
    },
    {
      id: "mock-ca-3",
      title: "Valider la grille de rémunération révisée",
      committeeName: "Comité RH",
      responsibleName: "Ismaël Traoré",
      dueDate: "2026-06-20",
      overdueDays: 3,
    },
  ],
};
