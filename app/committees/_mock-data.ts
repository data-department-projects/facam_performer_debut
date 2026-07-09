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
  frequency: "WEEKLY" | "SEMI_MONTHLY" | "BIMONTHLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC";
  projectNames: string[];
  departments: string[];
  participants: MockCommitteeMember[];
  guests: MockCommitteeMember[];
  meetings: MockMeeting[];
};

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
