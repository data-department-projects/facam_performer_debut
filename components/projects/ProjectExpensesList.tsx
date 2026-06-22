"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { createProjectExpense, deleteProjectExpense } from "@/actions/projects";
import { PROJECT_EXPENSE_TYPES } from "@/lib/schemas/project";

export type ProjectExpense = {
  id: string;
  label: string;
  amount: number;
  expenseType: "ONE_TIME" | "MONTHLY" | "ANNUAL";
  expenseDate: string;
};

type Props = {
  expenses: ProjectExpense[];
  projectId: string;
  initialBudget: number;
  isEditable: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  ONE_TIME: "Unique",
  MONTHLY: "Mensuelle",
  ANNUAL: "Annuelle",
};

const TYPE_COLORS: Record<string, string> = {
  ONE_TIME: "bg-gray100 text-gray600",
  MONTHLY: "bg-facamBlueTint text-facamBlue",
  ANNUAL: "bg-warningLight text-warning",
};

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

export function ProjectExpensesList({ expenses, projectId, initialBudget, isEditable }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState<"ONE_TIME" | "MONTHLY" | "ANNUAL">("ONE_TIME");
  const [expenseDate, setExpenseDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalConsumed = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetPercent = initialBudget > 0 ? Math.min(Math.round((totalConsumed / initialBudget) * 100), 100) : 0;

  function resetForm() {
    setLabel("");
    setAmount("");
    setExpenseType("ONE_TIME");
    setExpenseDate("");
    setFormError(null);
    setShowForm(false);
  }

  function handleAdd() {
    setFormError(null);
    startTransition(async () => {
      const result = await createProjectExpense(projectId, {
        label: label.trim(),
        amount: parseFloat(amount),
        expenseType,
        expenseDate,
      });
      if (!result.success) {
        setFormError(result.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      resetForm();
    });
  }

  function handleDelete(expenseId: string) {
    setDeletingId(expenseId);
    startTransition(async () => {
      await deleteProjectExpense(expenseId, projectId);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Résumé budgétaire */}
      <div className="rounded-xl border border-gray200 bg-facamWhite p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray500">Budget initial</span>
            <span className="text-sm font-semibold text-facamBlack">{fmt(initialBudget)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray500">Total dépensé</span>
            <span className={`text-sm font-semibold ${totalConsumed > initialBudget ? "text-error" : "text-facamBlack"}`}>
              {fmt(totalConsumed)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray500">Solde restant</span>
            <span className={`text-sm font-semibold ${initialBudget - totalConsumed < 0 ? "text-error" : "text-success"}`}>
              {fmt(initialBudget - totalConsumed)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray500">Consommation budgétaire</span>
            <span className="text-xs font-medium text-gray500">{budgetPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPercent >= 90 ? "bg-error" : budgetPercent >= 75 ? "bg-facamYellow" : "bg-facamBlue"
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Liste des dépenses */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-facamDark">Dépenses enregistrées</h3>
            <p className="mt-0.5 text-xs text-gray500">{expenses.length} dépense{expenses.length > 1 ? "s" : ""}</p>
          </div>
          {isEditable && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-facamBlue px-3 py-1.5 text-xs font-semibold text-facamWhite hover:bg-facamDark transition-colors"
            >
              <Plus size={13} />
              Ajouter une dépense
            </button>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {isEditable && showForm && (
          <div className="rounded-xl border border-facamBlue/30 bg-facamWhite p-4 shadow-sm flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-facamDark">Nouvelle dépense</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-medium text-gray500">Libellé <span className="text-error">*</span></label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex. Achat matériel, Prestation consultant…"
                  className="rounded-md border border-gray300 px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray500">Montant (FCFA) <span className="text-error">*</span></label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex. 500000"
                  className="rounded-md border border-gray300 px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray500">Type <span className="text-error">*</span></label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as typeof expenseType)}
                  className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
                >
                  {PROJECT_EXPENSE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray500">Date <span className="text-error">*</span></label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="rounded-md border border-gray300 px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-md bg-errorLight px-3 py-2 text-xs text-error">{formError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray300 px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-60 transition-colors"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Table des dépenses */}
        <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
          {expenses.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray400">Aucune dépense enregistrée pour ce projet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray200">
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Libellé</th>
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Type</th>
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Date</th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-widest text-gray500">Montant</th>
                  {isEditable && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray200 last:border-0 hover:bg-gray50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-facamBlack">{expense.label}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[expense.expenseType]}`}>
                        {TYPE_LABELS[expense.expenseType]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray500">
                      {new Date(expense.expenseDate + "T00:00:00").toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-facamBlack">
                      {expense.amount.toLocaleString("fr-FR")}
                    </td>
                    {isEditable && (
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="text-gray400 hover:text-error transition-colors disabled:opacity-50"
                        >
                          {deletingId === expense.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray200 bg-gray50">
                  <td colSpan={isEditable ? 3 : 3} className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray500">
                    Total
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-facamDark">
                    {fmt(totalConsumed)}
                  </td>
                  {isEditable && <td />}
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
