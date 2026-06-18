"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { projectSchema, type ProjectInput } from "@/lib/schemas/project";
import { createProject } from "@/actions/projects";

type Tab = 1 | 2 | 3 | 4 | 5;

const TABS: { id: Tab; label: string; shortLabel: string }[] = [
  { id: 1, label: "Identité", shortLabel: "1. Identité" },
  { id: 2, label: "Gouvernance", shortLabel: "2. Gouvernance" },
  { id: 3, label: "Cadrage temporel", shortLabel: "3. Cadrage" },
  { id: 4, label: "Financier", shortLabel: "4. Financier" },
  { id: 5, label: "Spécifications", shortLabel: "5. Spécifications" },
];

type UserOption = { id: string; fullName: string };
type DepartmentOption = { id: string; name: string };

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-gray500">
      {children}
      {required && <span className="ml-0.5 text-error">*</span>}
    </label>
  );
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <input
        className={`rounded-md border px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:outline-none focus:ring-2 focus:ring-facamBlue/20 ${
          error ? "border-error" : "border-gray300"
        } focus:border-facamBlue`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

function Textarea({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        rows={3}
        className={`rounded-md border px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:outline-none focus:ring-2 focus:ring-facamBlue/20 resize-none ${
          error ? "border-error" : "border-gray300"
        } focus:border-facamBlue`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

function Select({
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <select
        className={`rounded-md border px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 bg-facamWhite ${
          error ? "border-error" : "border-gray300"
        } focus:border-facamBlue`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

type Props = {
  users: UserOption[];
  departments: DepartmentOption[];
};

export function ProjectForm({ users, departments }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema) as unknown as Resolver<ProjectInput>,
    defaultValues: {
      beneficiaryType: "INTERNAL",
      teamMembers: [],
      expectedDeliverables: [],
      successCriteria: [],
      documentationLinks: [],
      externalExpensesPlanned: 0,
    },
  });

  const {
    fields: teamFields,
    append: appendTeamMember,
    remove: removeTeamMember,
  } = useFieldArray({ control, name: "teamMembers" });

  const {
    fields: deliverableFields,
    append: appendDeliverable,
    remove: removeDeliverable,
  } = useFieldArray({ control, name: "expectedDeliverables" });

  const {
    fields: criteriaFields,
    append: appendCriteria,
    remove: removeCriteria,
  } = useFieldArray({ control, name: "successCriteria" });

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({ control, name: "documentationLinks" });

  const beneficiaryType = watch("beneficiaryType");

  const onSubmit = async (data: ProjectInput) => {
    const result = await createProject(data);
    if (!result.success) {
      setError("root", { message: result.error ?? "Erreur inattendue." });
      return;
    }
    router.push(`/projects/${result.data!.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Onglets */}
      <div className="flex gap-1 rounded-xl border border-gray200 bg-facamWhite p-1 shadow-sm overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-facamBlue text-facamWhite shadow-sm"
                : "text-gray500 hover:bg-gray50 hover:text-facamDark"
            }`}
          >
            {tab.shortLabel}
          </button>
        ))}
      </div>

      {errors.root && (
        <div className="rounded-lg border border-errorLight bg-errorLight/30 px-4 py-3">
          <p className="text-sm text-error">{errors.root.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
          {/* ─── Onglet 1 : Identité ─── */}
          {activeTab === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-facamDark">Identité & Informations générales</h3>

              <div className="flex flex-col gap-1.5">
                <Label required>Nom du projet</Label>
                <Input
                  placeholder="Ex. Refonte du système de gestion RH"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label required>Description</Label>
                <Textarea
                  placeholder="Résumé du pourquoi et du quoi de ce projet..."
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label required>Catégorie</Label>
                  <Select error={errors.category?.message} {...register("category")}>
                    <option value="">Sélectionner une catégorie</option>
                    <option value="RESEARCH_DEVELOPMENT">R&D</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="CLIENT">Client</option>
                    <option value="INTERNAL_TRANSFORMATION">Transformation interne</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OTHER">Autre</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Priorité stratégique</Label>
                  <Select error={errors.strategicPriority?.message} {...register("strategicPriority")}>
                    <option value="">Sélectionner une priorité</option>
                    <option value="LOW">Faible</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HIGH">Élevé</option>
                    <option value="CRITICAL_REGULATORY">Critique / Réglementaire</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ─── Onglet 2 : Gouvernance ─── */}
          {activeTab === 2 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-facamDark">Gouvernance & Parties prenantes</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label required>Sponsor</Label>
                  <Select error={errors.sponsorUserId?.message} {...register("sponsorUserId")}>
                    <option value="">Sélectionner un sponsor</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Chef de Projet</Label>
                  <Select error={errors.projectManagerId?.message} {...register("projectManagerId")}>
                    <option value="">Sélectionner un chef de projet</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label required>Type de bénéficiaire</Label>
                <div className="flex gap-4">
                  {(["INTERNAL", "EXTERNAL"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        className="accent-facamBlue"
                        {...register("beneficiaryType")}
                      />
                      <span className="text-sm text-facamBlack">
                        {type === "INTERNAL" ? "Interne" : "Externe"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {beneficiaryType === "INTERNAL" ? (
                <div className="flex flex-col gap-1.5">
                  <Label>Département bénéficiaire</Label>
                  <Select {...register("beneficiaryDepartmentId")}>
                    <option value="">Sélectionner un département</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label>Nom du bénéficiaire externe</Label>
                  <Input
                    placeholder="Ex. Client XYZ SA"
                    {...register("beneficiaryExternalName")}
                  />
                </div>
              )}

              {/* Équipe projet */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Équipe projet</Label>
                  <button
                    type="button"
                    onClick={() => appendTeamMember({ userId: "", roleLabel: "" })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-facamBlue hover:underline"
                  >
                    <Plus size={13} />
                    Ajouter un membre
                  </button>
                </div>
                {teamFields.length === 0 && (
                  <p className="text-xs text-gray400">Aucun membre ajouté.</p>
                )}
                {teamFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <Select className="flex-1" {...register(`teamMembers.${index}.userId`)}>
                      <option value="">Membre</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </Select>
                    <Input
                      className="flex-1"
                      placeholder="Rôle dans le projet"
                      {...register(`teamMembers.${index}.roleLabel`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="mt-2 text-gray400 hover:text-error transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Onglet 3 : Cadrage temporel ─── */}
          {activeTab === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-facamDark">Cadrage temporel & Jalons</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label required>Date de début estimée</Label>
                  <Input
                    type="date"
                    error={errors.estimatedStartDate?.message}
                    {...register("estimatedStartDate")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Échéance cible</Label>
                  <Input
                    type="date"
                    error={errors.targetEndDate?.message}
                    {...register("targetEndDate")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Date de début réelle</Label>
                  <Input type="date" {...register("actualStartDate")} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Date de fin réelle</Label>
                  <Input type="date" {...register("actualEndDate")} />
                </div>
              </div>

              <div className="rounded-lg border border-gray200 bg-gray50 p-4">
                <p className="text-xs text-gray500">
                  Les jalons sont ajoutés depuis la vue Gantt du projet, après création. Cette section gère uniquement le cadrage temporel global.
                </p>
              </div>
            </div>
          )}

          {/* ─── Onglet 4 : Financier ─── */}
          {activeTab === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-facamDark">Gestion financière & Ressources</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label required>Budget initial (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex. 45000000"
                    error={errors.initialBudget?.message}
                    {...register("initialBudget")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Charge estimée (jours-homme)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex. 120"
                    error={errors.estimatedHrCostDays?.message}
                    {...register("estimatedHrCostDays")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Dépenses externes prévues (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex. 8000000"
                    {...register("externalExpensesPlanned")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Onglet 5 : Spécifications ─── */}
          {activeTab === 5 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold text-facamDark">Spécifications techniques & Livrables</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Périmètre inclus</Label>
                  <Textarea
                    placeholder="Ce qui est dans le périmètre du projet..."
                    {...register("scopeIncluded")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Périmètre exclu</Label>
                  <Textarea
                    placeholder="Ce qui est explicitement hors périmètre..."
                    {...register("scopeExcluded")}
                  />
                </div>
              </div>

              {/* Livrables */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Livrables attendus</Label>
                  <button
                    type="button"
                    onClick={() => appendDeliverable({ value: "" })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-facamBlue hover:underline"
                  >
                    <Plus size={13} />
                    Ajouter
                  </button>
                </div>
                {deliverableFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Ex. Module gestion des congés opérationnel"
                      {...register(`expectedDeliverables.${index}.value`)}
                    />
                    <button type="button" onClick={() => removeDeliverable(index)} className="text-gray400 hover:text-error">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Critères de succès */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Critères de succès</Label>
                  <button
                    type="button"
                    onClick={() => appendCriteria({ value: "" })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-facamBlue hover:underline"
                  >
                    <Plus size={13} />
                    Ajouter
                  </button>
                </div>
                {criteriaFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Ex. Réduction de 50% du temps de traitement"
                      {...register(`successCriteria.${index}.value`)}
                    />
                    <button type="button" onClick={() => removeCriteria(index)} className="text-gray400 hover:text-error">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Liens documentation */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Liens documentation</Label>
                  <button
                    type="button"
                    onClick={() => appendLink({ value: "" })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-facamBlue hover:underline"
                  >
                    <Plus size={13} />
                    Ajouter
                  </button>
                </div>
                {linkFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      type="url"
                      placeholder="https://..."
                      {...register(`documentationLinks.${index}.value`)}
                    />
                    <button type="button" onClick={() => removeLink(index)} className="text-gray400 hover:text-error">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boutons navigation + soumission */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab((prev) => Math.max(1, prev - 1) as Tab)}
            className={`rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50 transition-colors ${activeTab === 1 ? "invisible" : ""}`}
          >
            ← Section précédente
          </button>

          {activeTab < 5 ? (
            <button
              type="button"
              onClick={() => setActiveTab((prev) => Math.min(5, prev + 1) as Tab)}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
            >
              Section suivante
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-5 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Création en cours..." : "Créer le projet"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
