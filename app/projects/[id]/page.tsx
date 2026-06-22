import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectDetailTabs } from "@/components/projects/ProjectDetailTabs";
import type { MockProjectDetail } from "@/components/projects/ProjectFicheView";
import type { MockMilestone } from "@/components/projects/ProjectMilestonesList";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Données mock conservées pour le développement ───────────────────────────
const MOCK_PROJECTS: Record<string, MockProjectDetail> = {
  "1": {
    id: "1",
    code: "PRJ-2026-001",
    name: "Refonte du système de gestion RH",
    description:
      "Modernisation complète du système RH pour améliorer l'efficacité opérationnelle et la conformité réglementaire.",
    category: "INTERNAL_TRANSFORMATION",
    strategicPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    isConfirmed: true,
    sponsor: "Direction Générale",
    projectManager: "Adjoua Konan",
    beneficiaryType: "INTERNAL",
    beneficiaryName: "Direction des Ressources Humaines",
    teamMembers: [
      { name: "Kofi Mensah", role: "Expert Métier" },
      { name: "Ama Asante", role: "Développeuse Senior" },
      { name: "Yves Traoré", role: "Analyste Fonctionnel" },
    ],
    estimatedStartDate: "2026-03-01",
    actualStartDate: "2026-03-05",
    targetEndDate: "2026-09-30",
    initialBudget: 45000000,
    scopeIncluded:
      "Gestion des congés, suivi des performances, paie automatisée, tableau de bord RH.",
    scopeExcluded:
      "Recrutement en ligne, gestion de la formation (couvert par un autre projet).",
    expectedDeliverables: [
      "Module gestion des congés opérationnel",
      "Dashboard RH avec KPIs",
      "Intégration paie automatisée",
      "Documentation utilisateur",
    ],
    successCriteria: [
      "Réduction de 50% du temps de traitement des congés",
      "Taux d'adoption > 90% après 3 mois",
      "Zéro erreur de paie sur les 2 premiers cycles",
    ],
    documentationLinks: [
      "https://drive.facam.tg/docs/cahier-charges-rh",
      "https://drive.facam.tg/docs/maquettes-rh",
    ],
  },
  "2": {
    id: "2",
    code: "PRJ-2026-002",
    name: "Déploiement infrastructure cloud AWS",
    description:
      "Migration de l'infrastructure on-premise vers AWS pour améliorer la scalabilité et réduire les coûts opérationnels.",
    category: "INFRASTRUCTURE",
    strategicPriority: "CRITICAL_REGULATORY",
    currentStatus: "INITIATED",
    isConfirmed: true,
    sponsor: "Direction Technique",
    projectManager: "Kofi Mensah",
    beneficiaryType: "INTERNAL",
    beneficiaryName: "Direction des Systèmes d'Information",
    teamMembers: [
      { name: "Fatou Diallo", role: "Architecte Cloud" },
      { name: "Moussa Coulibaly", role: "Ingénieur DevOps" },
    ],
    estimatedStartDate: "2026-04-01",
    targetEndDate: "2026-12-15",
    initialBudget: 80000000,
    scopeIncluded: "Migration VMs, mise en place CI/CD, configuration sécurité AWS.",
    scopeExcluded: "Refonte des applications métier (hors périmètre).",
    expectedDeliverables: [
      "Infrastructure AWS opérationnelle",
      "Pipeline CI/CD configuré",
      "Documentation d'architecture",
      "Plan de reprise après sinistre (PRA)",
    ],
    successCriteria: [
      "Disponibilité 99.9% garantie",
      "Réduction des coûts infra de 30% sur 12 mois",
      "Migration sans interruption de service > 4h",
    ],
    documentationLinks: [],
  },
  "3": {
    id: "3",
    code: "PRJ-2026-003",
    name: "Audit de conformité réglementaire",
    description:
      "Audit complet des processus internes pour vérifier la conformité aux nouvelles réglementations sectorielles.",
    category: "RESEARCH_DEVELOPMENT",
    strategicPriority: "CRITICAL_REGULATORY",
    currentStatus: "PENDING",
    isConfirmed: false,
    confirmationNote:
      "Compléter la section Gouvernance avec le nom du sponsor et préciser le périmètre exclu avant confirmation.",
    sponsor: "À définir",
    projectManager: "Fatou Diallo",
    beneficiaryType: "INTERNAL",
    beneficiaryName: "Direction Juridique & Conformité",
    teamMembers: [],
    estimatedStartDate: "2026-05-01",
    targetEndDate: "2026-08-01",
    initialBudget: 12000000,
    scopeIncluded: "Revue des processus financiers, RH et IT.",
    scopeExcluded: "",
    expectedDeliverables: ["Rapport d'audit", "Plan de remédiation"],
    successCriteria: ["Rapport livré dans les délais", "Zéro non-conformité critique"],
    documentationLinks: [],
  },
  "4": {
    id: "4",
    code: "PRJ-2026-004",
    name: "Formation et montée en compétences équipe technique",
    description:
      "Programme de formation accéléré pour renforcer les compétences cloud et DevOps de l'équipe technique.",
    category: "INTERNAL_TRANSFORMATION",
    strategicPriority: "MEDIUM",
    currentStatus: "IN_PROGRESS",
    isConfirmed: true,
    sponsor: "Direction des Ressources Humaines",
    projectManager: "Mabibè BANKATI",
    beneficiaryType: "INTERNAL",
    beneficiaryName: "Équipe Technique DSI",
    teamMembers: [
      { name: "Adjoua Konan", role: "Coordinatrice pédagogique" },
    ],
    estimatedStartDate: "2026-02-01",
    actualStartDate: "2026-02-03",
    targetEndDate: "2026-07-31",
    initialBudget: 9500000,
    scopeIncluded: "Formations AWS, Docker, Kubernetes, CI/CD GitLab.",
    scopeExcluded: "Formations management et soft skills (couvert par le plan RH annuel).",
    expectedDeliverables: [
      "8 membres d'équipe certifiés AWS Solutions Architect",
      "Rapport de compétences avant/après",
    ],
    successCriteria: [
      "Taux de certification ≥ 75%",
      "Score moyen aux évaluations ≥ 70/100",
    ],
    documentationLinks: [],
  },
};

const MOCK_MILESTONES: Record<string, MockMilestone[]> = {
  "1": [
    { id: "m1", title: "Kick-off & validation des spécifications", targetDate: "2026-03-15", achievedDate: "2026-03-12" },
    { id: "m2", title: "Module congés opérationnel", targetDate: "2026-05-31", achievedDate: "2026-06-02" },
    { id: "m3", title: "Intégration paie automatisée", targetDate: "2026-07-31" },
    { id: "m4", title: "Recette finale & Go Live", targetDate: "2026-09-15" },
  ],
  "2": [
    { id: "m1", title: "Kick-off & choix d'architecture", targetDate: "2026-04-20" },
    { id: "m2", title: "Migration environnement de développement", targetDate: "2026-06-30" },
    { id: "m3", title: "Migration environnement de production", targetDate: "2026-10-31" },
    { id: "m4", title: "Validation sécurité & PRA", targetDate: "2026-12-01" },
  ],
  "3": [
    { id: "m1", title: "Lancement de l'audit", targetDate: "2026-05-15" },
    { id: "m2", title: "Remise du rapport préliminaire", targetDate: "2026-07-01" },
    { id: "m3", title: "Rapport final et plan de remédiation", targetDate: "2026-08-01" },
  ],
  "4": [
    { id: "m1", title: "Démarrage des formations AWS", targetDate: "2026-02-10", achievedDate: "2026-02-10" },
    { id: "m2", title: "Passage des certifications AWS (session 1)", targetDate: "2026-04-30", achievedDate: "2026-05-03" },
    { id: "m3", title: "Passage des certifications AWS (session 2)", targetDate: "2026-07-15" },
    { id: "m4", title: "Rapport final de compétences", targetDate: "2026-07-31" },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userRole = session?.user?.role;
  const isEditable = userRole !== "COLLABORATOR";
  const isAdmin = userRole === "ADMIN";

  // Charger depuis la DB en priorité (projets créés via le formulaire)
  const dbProject = await prisma.project.findUnique({
    where: { id },
    include: {
      sponsor: { select: { fullName: true } },
      projectManager: { select: { fullName: true } },
      beneficiaryDepartment: { select: { name: true } },
      confirmedBy: { select: { fullName: true } },
      teamMembers: {
        include: { user: { select: { fullName: true } } },
      },
      milestones: { orderBy: { targetDate: "asc" } },
      expenses: { orderBy: { expenseDate: "desc" } },
    },
  });

  if (dbProject) {
    const project: MockProjectDetail = {
      id: dbProject.id,
      code: dbProject.code,
      name: dbProject.name,
      description: dbProject.description ?? "",
      category: dbProject.category,
      strategicPriority: dbProject.strategicPriority,
      currentStatus: dbProject.currentStatus,
      isConfirmed: dbProject.isConfirmed,
      confirmationNote: dbProject.confirmationNote ?? undefined,
      sponsor: dbProject.sponsor.fullName,
      projectManager: dbProject.projectManager.fullName,
      beneficiaryType: dbProject.beneficiaryType,
      beneficiaryName:
        dbProject.beneficiaryDepartment?.name ??
        dbProject.beneficiaryExternalName ??
        "—",
      teamMembers: dbProject.teamMembers.map((m) => ({
        name: m.user.fullName,
        role: m.roleLabel,
      })),
      estimatedStartDate: dbProject.estimatedStartDate.toISOString().split("T")[0],
      actualStartDate: dbProject.actualStartDate
        ? dbProject.actualStartDate.toISOString().split("T")[0]
        : undefined,
      targetEndDate: dbProject.targetEndDate.toISOString().split("T")[0],
      actualEndDate: dbProject.actualEndDate
        ? dbProject.actualEndDate.toISOString().split("T")[0]
        : undefined,
      initialBudget: Number(dbProject.initialBudget),
      scopeIncluded: dbProject.scopeIncluded ?? "",
      scopeExcluded: dbProject.scopeExcluded ?? "",
      expectedDeliverables: dbProject.expectedDeliverables,
      successCriteria: dbProject.successCriteria,
      documentationLinks: dbProject.documentationLinks,
    };

    const milestones: MockMilestone[] = dbProject.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      targetDate: m.targetDate.toISOString().split("T")[0],
      achievedDate: m.achievedDate
        ? m.achievedDate.toISOString().split("T")[0]
        : undefined,
    }));

    const expenses = dbProject.expenses.map((e) => ({
      id: e.id,
      label: e.label,
      amount: Number(e.amount),
      expenseType: e.expenseType as "ONE_TIME" | "MONTHLY" | "ANNUAL",
      expenseDate: e.expenseDate.toISOString().split("T")[0],
    }));

    return (
      <AppShell pageTitle={project.name}>
        <div className="mb-2">
          <Link href="/projects" className="text-xs text-gray400 hover:text-facamBlue transition-colors">
            ← Retour aux projets
          </Link>
        </div>
        <ProjectDetailTabs
          project={project}
          milestones={milestones}
          expenses={expenses}
          projectId={dbProject.id}
          isEditable={isEditable}
          isAdmin={isAdmin}
          confirmedAt={dbProject.confirmedAt?.toISOString()}
          confirmedByName={dbProject.confirmedBy?.fullName}
        />
      </AppShell>
    );
  }

  // Fallback mock (IDs "1"–"4") — phase de développement uniquement
  const mockProject = MOCK_PROJECTS[id];
  if (!mockProject) notFound();

  const mockMilestones = MOCK_MILESTONES[id] ?? [];

  return (
    <AppShell pageTitle={mockProject.name}>
      <div className="mb-2">
        <Link href="/projects" className="text-xs text-gray400 hover:text-facamBlue transition-colors">
          ← Retour aux projets
        </Link>
      </div>
      <ProjectDetailTabs
        project={mockProject}
        milestones={mockMilestones}
        expenses={[]}
        projectId={id}
        isEditable={isEditable}
        isAdmin={isAdmin}
      />
    </AppShell>
  );
}
