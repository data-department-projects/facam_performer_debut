import type { DashboardData } from "@/components/dashboard/types";

const SHARED_BAR_CHART = [
  { name: "Digital Hub", progress: 72 },
  { name: "Refonte SI", progress: 45 },
  { name: "Formation Interne", progress: 91 },
  { name: "Audit Qualité", progress: 30 },
  { name: "Migration Cloud", progress: 58 },
];

const SHARED_PIE_CHART = [
  { name: "Terminé", value: 42, color: "#16a34a" },
  { name: "En cours", value: 28, color: "#ffae03" },
  { name: "Non terminé", value: 12, color: "#b91c1c" },
  { name: "Non démarré", value: 18, color: "#e5e7eb" },
];

const SHARED_ACTIVITY = [
  {
    id: "1",
    type: "project" as const,
    description: "Projet « Migration Cloud AWS » créé",
    actor: "Awa Diallo",
    timestamp: "2026-06-23T08:15:00Z",
  },
  {
    id: "2",
    type: "week-planner" as const,
    description: "Semaine du 23–27 juin soumise pour validation",
    actor: "Kofi Mensah",
    timestamp: "2026-06-23T07:52:00Z",
  },
  {
    id: "3",
    type: "committee" as const,
    description: "Action « Réviser la charte de gouvernance » marquée DONE",
    actor: "Fatou Camara",
    timestamp: "2026-06-22T16:30:00Z",
  },
  {
    id: "4",
    type: "objective" as const,
    description: "Résultat clé « Obtenir certification AWS SAA » mis à jour",
    actor: "Ibrahima Sow",
    timestamp: "2026-06-22T14:10:00Z",
  },
  {
    id: "5",
    type: "project" as const,
    description: "Projet « Audit Qualité ISO 9001 » confirmé",
    actor: "Administrateur",
    timestamp: "2026-06-21T11:05:00Z",
  },
];

export const MOCK_ADMIN_DASHBOARD: DashboardData = {
  kpis: [
    { label: "Taux d'exécution global", value: "74%", color: "blue" },
    { label: "Avancement moyen des projets", value: "58%", color: "success" },
    { label: "Réalisation décisions comités", value: "81%", color: "yellow" },
    { label: "Actions à traiter", value: "7", color: "error" },
  ],
  barChartData: SHARED_BAR_CHART,
  pieChartData: SHARED_PIE_CHART,
  recentActivity: SHARED_ACTIVITY,
  tableRows: [
    {
      id: "1",
      code: "PRJ-2026-003",
      name: "Migration Cloud AWS",
      managerName: "Awa Diallo",
      createdAt: "2026-06-10",
      strategicPriority: "HIGH",
    },
    {
      id: "2",
      code: "PRJ-2026-005",
      name: "Digitalisation RH",
      managerName: "Moussa Koné",
      createdAt: "2026-06-15",
      strategicPriority: "MEDIUM",
    },
    {
      id: "3",
      code: "PRJ-2026-007",
      name: "Plateforme e-learning",
      managerName: "Aïcha Traoré",
      createdAt: "2026-06-18",
      strategicPriority: "CRITICAL_REGULATORY",
    },
    {
      id: "4",
      code: "PRJ-2026-008",
      name: "Optimisation Supply Chain",
      managerName: "Bah Seydou",
      createdAt: "2026-06-20",
      strategicPriority: "HIGH",
    },
  ],
};

export const MOCK_MANAGER_DASHBOARD: DashboardData = {
  kpis: [
    { label: "Taux d'exécution équipe", value: "68%", color: "blue" },
    { label: "Projets actifs département", value: "4", color: "success" },
    { label: "Réalisation décisions comités", value: "75%", color: "yellow" },
    { label: "Actions à traiter", value: "3", color: "error" },
  ],
  barChartData: SHARED_BAR_CHART,
  pieChartData: SHARED_PIE_CHART,
  recentActivity: SHARED_ACTIVITY.slice(0, 4),
  tableRows: [
    {
      id: "1",
      collaboratorName: "Kofi Mensah",
      weekStatus: "VALIDATED",
      totalTasks: 8,
      doneTasks: 7,
    },
    {
      id: "2",
      collaboratorName: "Fatou Camara",
      weekStatus: "SUBMITTED",
      totalTasks: 6,
      doneTasks: 0,
    },
    {
      id: "3",
      collaboratorName: "Ibrahima Sow",
      weekStatus: "VALIDATED",
      totalTasks: 9,
      doneTasks: 5,
    },
    {
      id: "4",
      collaboratorName: "Mariama Baldé",
      weekStatus: "DRAFT",
      totalTasks: 0,
      doneTasks: 0,
    },
    {
      id: "5",
      collaboratorName: "Lamine Diakité",
      weekStatus: "NONE",
      totalTasks: 0,
      doneTasks: 0,
    },
  ],
};

export const MOCK_COLLABORATOR_DASHBOARD: DashboardData = {
  kpis: [
    { label: "Mes tâches DONE cette semaine", value: "5 / 8", color: "blue" },
    { label: "% complétion objectifs", value: "62%", color: "success" },
    { label: "Mes projets actifs", value: "2", color: "yellow" },
    { label: "Prochaine réunion", value: "Mer. 25 juin", color: "blue" },
  ],
  barChartData: [
    { name: "Digital Hub", progress: 72 },
    { name: "Formation Interne", progress: 91 },
  ],
  pieChartData: [
    { name: "Terminé", value: 5, color: "#16a34a" },
    { name: "En cours", value: 2, color: "#ffae03" },
    { name: "Non terminé", value: 1, color: "#b91c1c" },
  ],
  recentActivity: SHARED_ACTIVITY.slice(1, 4),
  tableRows: [
    {
      id: "1",
      objectiveName: "Développement commercial",
      description: "Ajouter 3 nouveaux clients",
      targetValue: 3,
      currentValue: 1,
      status: "IN_PROGRESS",
      dueDate: "2026-12-31",
    },
    {
      id: "2",
      objectiveName: "Certification technique",
      description: "Obtenir la certification AWS Solutions Architect",
      targetValue: null,
      currentValue: null,
      status: "IN_PROGRESS",
      dueDate: "2026-09-30",
    },
    {
      id: "3",
      objectiveName: "Développement commercial",
      description: "Vendre 50 produits avant le 31/12",
      targetValue: 50,
      currentValue: 18,
      status: "IN_PROGRESS",
      dueDate: "2026-12-31",
    },
    {
      id: "4",
      objectiveName: "Amélioration processus",
      description: "Réduire le délai de traitement des dossiers de 20%",
      targetValue: 20,
      currentValue: 20,
      status: "DONE",
      dueDate: "2026-06-30",
    },
  ],
};
