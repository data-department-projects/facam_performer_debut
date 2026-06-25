// Données mock partagées entre la liste et le détail — remplacées par Prisma en feature 15

export type MockAction = {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  status: "PENDING" | "DONE";
};

export type MockMeeting = {
  id: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  actions: MockAction[];
};

export type MockCommitteeMember = {
  id: string;
  name: string;
  role: string;
};

export type MockCommittee = {
  id: string;
  name: string;
  description?: string;
  responsible: string;
  objectives: string;
  frequency: "WEEKLY" | "BIMONTHLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC";
  projectId?: string;
  projectName?: string;
  departments: string[];
  participants: MockCommitteeMember[];
  guests: MockCommitteeMember[];
  meetings: MockMeeting[];
};

export const MOCK_COMMITTEES: MockCommittee[] = [
  {
    id: "1",
    name: "Comité de Direction",
    responsible: "Amara Diallo",
    objectives:
      "Piloter la stratégie de l'organisation, arbitrer les décisions transversales et assurer l'alignement entre les départements sur les priorités institutionnelles.",
    frequency: "MONTHLY",
    departments: ["Direction Générale", "Ressources Humaines", "Finance"],
    participants: [
      { id: "u1", name: "Amara Diallo", role: "Directeur Général" },
      { id: "u2", name: "Fatou Camara", role: "DRH" },
      { id: "u3", name: "Kofi Mensah", role: "DAF" },
    ],
    guests: [{ id: "u4", name: "Ama Asante", role: "Responsable Projets" }],
    meetings: [
      {
        id: "m1",
        meetingDate: "2026-05-15",
        startTime: "09:00",
        endTime: "11:00",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        actions: [
          {
            id: "a1",
            title: "Valider le budget Q3 2026",
            responsible: "Kofi Mensah",
            dueDate: "2026-05-30",
            status: "DONE",
          },
          {
            id: "a2",
            title: "Préparer le rapport de performance semestriel",
            responsible: "Fatou Camara",
            dueDate: "2026-06-15",
            status: "DONE",
          },
          {
            id: "a3",
            title: "Mettre à jour la cartographie des risques institutionnels",
            responsible: "Amara Diallo",
            dueDate: "2026-06-30",
            status: "PENDING",
          },
        ],
      },
      {
        id: "m2",
        meetingDate: "2026-06-19",
        startTime: "09:00",
        endTime: "11:00",
        meetingLink: "https://meet.google.com/xyz-uvwx-yz",
        actions: [
          {
            id: "a4",
            title: "Lancer le processus de recrutement Q3",
            responsible: "Fatou Camara",
            dueDate: "2026-07-01",
            status: "PENDING",
          },
          {
            id: "a5",
            title: "Finaliser le plan d'investissement 2026",
            responsible: "Kofi Mensah",
            dueDate: "2026-07-15",
            status: "PENDING",
          },
        ],
      },
      {
        id: "m3",
        meetingDate: "2026-07-17",
        startTime: "09:00",
        endTime: "11:00",
        actions: [],
      },
    ],
  },
  {
    id: "2",
    name: "Comité Qualité & Conformité",
    responsible: "Yves Traoré",
    objectives:
      "Garantir la conformité aux normes et réglementations en vigueur, suivre les indicateurs de qualité et piloter les plans d'amélioration continue des processus.",
    frequency: "QUARTERLY",
    departments: ["Qualité", "Juridique", "Opérations"],
    participants: [
      { id: "u5", name: "Yves Traoré", role: "Responsable Qualité" },
      { id: "u6", name: "Adjoua Konan", role: "Juriste Senior" },
    ],
    guests: [],
    meetings: [
      {
        id: "m4",
        meetingDate: "2026-03-20",
        startTime: "14:00",
        endTime: "16:00",
        actions: [
          {
            id: "a6",
            title: "Mettre à jour le manuel qualité ISO 9001",
            responsible: "Yves Traoré",
            dueDate: "2026-04-15",
            status: "DONE",
          },
          {
            id: "a7",
            title: "Former les équipes aux nouvelles procédures de conformité",
            responsible: "Adjoua Konan",
            dueDate: "2026-04-30",
            status: "DONE",
          },
          {
            id: "a8",
            title: "Conduire l'audit interne Q2",
            responsible: "Yves Traoré",
            dueDate: "2026-06-30",
            status: "DONE",
          },
        ],
      },
      {
        id: "m5",
        meetingDate: "2026-06-20",
        startTime: "14:00",
        endTime: "16:30",
        actions: [
          {
            id: "a9",
            title: "Préparer le rapport de conformité RGPD pour l'autorité de contrôle",
            responsible: "Adjoua Konan",
            dueDate: "2026-07-31",
            status: "PENDING",
          },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Comité Digital & Innovation",
    responsible: "Ama Asante",
    objectives:
      "Piloter la transformation numérique de FACAM STAIRWAY, évaluer les opportunités technologiques émergentes et assurer le suivi des projets d'innovation en cours.",
    frequency: "MONTHLY",
    departments: ["DSI", "Innovation", "Marketing"],
    participants: [
      { id: "u4", name: "Ama Asante", role: "DSI" },
      { id: "u7", name: "Kwame Boateng", role: "Chef Innovation" },
      { id: "u8", name: "Mariame Bah", role: "Responsable Marketing Digital" },
    ],
    guests: [{ id: "u9", name: "Sékou Diarra", role: "Consultant Externe" }],
    meetings: [
      {
        id: "m6",
        meetingDate: "2026-07-08",
        startTime: "10:00",
        endTime: "12:00",
        meetingLink: "https://teams.microsoft.com/l/meetup/innovation-july",
        actions: [],
      },
    ],
  },
];

export const MOCK_USERS_FOR_FORM = [
  { id: "u1", name: "Amara Diallo" },
  { id: "u2", name: "Fatou Camara" },
  { id: "u3", name: "Kofi Mensah" },
  { id: "u4", name: "Ama Asante" },
  { id: "u5", name: "Yves Traoré" },
  { id: "u6", name: "Adjoua Konan" },
  { id: "u7", name: "Kwame Boateng" },
  { id: "u8", name: "Mariame Bah" },
  { id: "u9", name: "Sékou Diarra" },
];

export const MOCK_DEPARTMENTS_FOR_FORM = [
  "Direction Générale",
  "Ressources Humaines",
  "Finance",
  "Qualité",
  "Juridique",
  "Opérations",
  "DSI",
  "Innovation",
  "Marketing",
  "Commercial",
];
