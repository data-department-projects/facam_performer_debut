import { CheckCircle2, Clock } from "lucide-react";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

export type MockProjectDetail = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  strategicPriority: string;
  currentStatus:
    | "PENDING"
    | "INITIATED"
    | "IN_PROGRESS"
    | "PAUSED"
    | "DELIVERED"
    | "CANCELLED";
  isConfirmed: boolean;
  confirmationNote?: string;
  // Gouvernance
  sponsor: string;
  projectManager: string;
  beneficiaryType: "INTERNAL" | "EXTERNAL";
  beneficiaryName: string;
  teamMembers: { name: string; role: string }[];
  // Cadrage temporel
  estimatedStartDate: string;
  actualStartDate?: string;
  targetEndDate: string;
  actualEndDate?: string;
  // Financier
  initialBudget: number;
  // Spécifications
  scopeIncluded: string;
  scopeExcluded: string;
  expectedDeliverables: string[];
  successCriteria: string[];
  documentationLinks: string[];
};

type Props = {
  project: MockProjectDetail;
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-facamDark">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray500">{label}</span>
      <span className="text-sm font-medium text-facamBlack">{value ?? "—"}</span>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  RESEARCH_DEVELOPMENT: "R&D",
  INFRASTRUCTURE: "Infrastructure",
  CLIENT: "Client",
  INTERNAL_TRANSFORMATION: "Transformation interne",
  MARKETING: "Marketing",
  OTHER: "Autre",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  CRITICAL_REGULATORY: "Critique / Réglementaire",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray100 text-gray600",
  MEDIUM: "bg-facamBlueTint text-facamBlue",
  HIGH: "bg-warningLight text-warning",
  CRITICAL_REGULATORY: "bg-errorLight text-error",
};

export function ProjectFicheView({ project }: Props) {

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-start justify-between rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-gray400">{project.code}</span>
          <h2 className="text-lg font-semibold text-facamDark">{project.name}</h2>
          <p className="mt-1 text-sm text-gray500">{project.description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ProjectStatusBadge status={project.currentStatus} />
          {project.isConfirmed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-successLight px-2 py-0.5 text-xs font-medium text-success">
              <CheckCircle2 size={12} />
              Confirmé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warningLight px-2 py-0.5 text-xs font-medium text-warning">
              <Clock size={12} />
              Non confirmé
            </span>
          )}
        </div>
      </div>

      {/* 1 — Identité */}
      <SectionCard title="1. Identité & Informations générales">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Field label="Catégorie" value={CATEGORY_LABELS[project.category] ?? project.category} />
          <Field
            label="Priorité stratégique"
            value={
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[project.strategicPriority] ?? "bg-gray100 text-gray600"}`}>
                {PRIORITY_LABELS[project.strategicPriority] ?? project.strategicPriority}
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* 2 — Gouvernance */}
      <SectionCard title="2. Gouvernance & Parties prenantes">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Field label="Sponsor" value={project.sponsor} />
          <Field label="Chef de Projet" value={project.projectManager} />
          <Field
            label="Bénéficiaire"
            value={`${project.beneficiaryType === "INTERNAL" ? "Interne" : "Externe"} — ${project.beneficiaryName}`}
          />
        </div>
        {project.teamMembers.length > 0 && (
          <div className="mt-4">
            <span className="text-xs text-gray500">Équipe projet</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.teamMembers.map((m, i) => (
                <span
                  key={i}
                  className="rounded-full border border-gray200 bg-gray50 px-3 py-1 text-xs font-medium text-facamBlack"
                >
                  {m.name} <span className="text-gray400">· {m.role}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* 3 — Cadrage temporel */}
      <SectionCard title="3. Cadrage temporel & Jalons">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field
            label="Début estimé"
            value={new Date(project.estimatedStartDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          />
          <Field
            label="Début réel"
            value={project.actualStartDate
              ? new Date(project.actualStartDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "—"}
          />
          <Field
            label="Échéance cible"
            value={new Date(project.targetEndDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          />
          <Field
            label="Fin réelle"
            value={project.actualEndDate
              ? new Date(project.actualEndDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "—"}
          />
        </div>
      </SectionCard>

      {/* 4 — Financier */}
      <SectionCard title="4. Gestion financière">
        <Field
          label="Budget initial"
          value={`${project.initialBudget.toLocaleString("fr-FR")} FCFA`}
        />
        <p className="mt-3 text-xs text-gray400">
          Le détail des dépenses est disponible dans l&apos;onglet <strong>Finances</strong>.
        </p>
      </SectionCard>

      {/* 5 — Spécifications */}
      <SectionCard title="5. Spécifications techniques & Livrables">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray500">Périmètre inclus</span>
            <p className="text-sm text-facamBlack">{project.scopeIncluded || "—"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray500">Périmètre exclu</span>
            <p className="text-sm text-facamBlack">{project.scopeExcluded || "—"}</p>
          </div>
        </div>
        {project.expectedDeliverables.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-xs text-gray500">Livrables attendus</span>
            <ul className="mt-1 flex flex-col gap-1">
              {project.expectedDeliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-facamBlack">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-facamBlue" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.successCriteria.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-xs text-gray500">Critères de succès</span>
            <ul className="mt-1 flex flex-col gap-1">
              {project.successCriteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-facamBlack">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.documentationLinks.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <span className="text-xs text-gray500">Liens documentation</span>
            <ul className="mt-1 flex flex-col gap-1">
              {project.documentationLinks.map((link, i) => (
                <li key={i} className="text-sm text-facamBlue hover:underline break-all">
                  {link}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* Note de confirmation */}
      {!project.isConfirmed && project.confirmationNote && (
        <div className="rounded-xl border border-warningLight bg-warningLight/30 p-4">
          <p className="text-xs font-medium text-warning">Note de l&apos;Administrateur</p>
          <p className="mt-1 text-sm text-facamBlack">{project.confirmationNote}</p>
        </div>
      )}
    </div>
  );
}
