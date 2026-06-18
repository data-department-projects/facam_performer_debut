import { AppShell } from "@/components/layout/AppShell";
import { ProjectList } from "@/components/projects/ProjectList";
import type { MockProject } from "@/components/projects/ProjectList";

const MOCK_PROJECTS: MockProject[] = [
  {
    id: "1",
    code: "PRJ-2026-001",
    name: "Refonte du système de gestion RH",
    projectManager: "Adjoua Konan",
    currentStatus: "IN_PROGRESS",
    isConfirmed: true,
    progressPercent: 42,
    targetEndDate: "2026-09-30",
  },
  {
    id: "2",
    code: "PRJ-2026-002",
    name: "Déploiement infrastructure cloud AWS",
    projectManager: "Kofi Mensah",
    currentStatus: "INITIATED",
    isConfirmed: true,
    progressPercent: 15,
    targetEndDate: "2026-12-15",
  },
  {
    id: "3",
    code: "PRJ-2026-003",
    name: "Audit de conformité réglementaire",
    projectManager: "Fatou Diallo",
    currentStatus: "PENDING",
    isConfirmed: false,
    progressPercent: 0,
    targetEndDate: "2026-08-01",
  },
  {
    id: "4",
    code: "PRJ-2026-004",
    name: "Formation et montée en compétences équipe technique",
    projectManager: "Mabibè BANKATI",
    currentStatus: "IN_PROGRESS",
    isConfirmed: true,
    progressPercent: 68,
    targetEndDate: "2026-07-31",
  },
];

export default async function ProjectsPage() {
  return (
    <AppShell pageTitle="Projets & Planification">
      <ProjectList projects={MOCK_PROJECTS} />
    </AppShell>
  );
}
