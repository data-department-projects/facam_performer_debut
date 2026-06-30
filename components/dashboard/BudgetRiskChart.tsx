"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from "recharts";
import type { BudgetRiskItem } from "./types";

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#9ca3af",
  MEDIUM: "#001b61",
  HIGH: "#ffae03",
  CRITICAL_REGULATORY: "#b91c1c",
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL_REGULATORY: "Critique",
};

type TooltipPayload = {
  payload: BudgetRiskItem;
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-gray200 bg-facamWhite p-3 shadow-md text-sm">
      <p className="font-semibold text-facamDark">{d.code}</p>
      <p className="text-gray600 truncate max-w-[180px]">{d.name}</p>
      <div className="mt-2 flex flex-col gap-1 text-xs">
        <span className="text-gray500">
          Avancement : <strong className="text-facamDark">{d.progressPercent}%</strong>
        </span>
        <span className="text-gray500">
          Budget consommé :{" "}
          <strong
            className={d.budgetConsumedPercent > 100 ? "text-error" : d.budgetConsumedPercent > 80 ? "text-warning" : "text-success"}
          >
            {d.budgetConsumedPercent}%
          </strong>
        </span>
        <span className="text-gray500">
          Priorité :{" "}
          <strong className="text-facamDark">{PRIORITY_LABEL[d.priority] ?? d.priority}</strong>
        </span>
      </div>
    </div>
  );
}

export function BudgetRiskChart({ data }: { data: BudgetRiskItem[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-1 text-base font-semibold text-facamDark">
          Matrice Risque Budgétaire
        </p>
        <p className="text-sm text-gray400">Aucun projet actif avec budget défini.</p>
      </div>
    );
  }

  const grouped: Record<string, BudgetRiskItem[]> = {};
  for (const item of data) {
    if (!grouped[item.priority]) grouped[item.priority] = [];
    grouped[item.priority].push(item);
  }

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-base font-semibold text-facamDark">Matrice Risque Budgétaire</p>
        <div className="flex items-center gap-3">
          {Object.entries(PRIORITY_COLOR).map(([key, color]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-gray500">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {PRIORITY_LABEL[key]}
            </span>
          ))}
        </div>
      </div>
      <p className="mb-4 text-xs text-gray400">
        Axe X = avancement des tâches · Axe Y = budget consommé · Zone danger : haut gauche
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Lignes de seuil à 60% et 80% */}
          <ReferenceLine x={60} stroke="#e5e7eb" strokeDasharray="4 4" />
          <ReferenceLine y={80} stroke="#b91c1c" strokeDasharray="4 4" strokeWidth={1.5} />

          <XAxis
            type="number"
            dataKey="progressPercent"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          >
            <Label
              value="Avancement (%)"
              offset={-8}
              position="insideBottom"
              style={{ fontSize: 11, fill: "#9ca3af" }}
            />
          </XAxis>

          <YAxis
            type="number"
            dataKey="budgetConsumedPercent"
            domain={[0, 120]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          >
            <Label
              value="Budget consommé (%)"
              angle={-90}
              position="insideLeft"
              offset={8}
              style={{ fontSize: 11, fill: "#9ca3af" }}
            />
          </YAxis>

          <Tooltip content={<CustomTooltip />} />

          {Object.entries(grouped).map(([priority, items]) => (
            <Scatter
              key={priority}
              name={PRIORITY_LABEL[priority] ?? priority}
              data={items}
              fill={PRIORITY_COLOR[priority] ?? "#9ca3af"}
              opacity={0.85}
              r={7}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Légende des quadrants */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-errorLight px-3 py-1.5 text-error font-medium">
          ↖ DANGER — Budget élevé, peu d&apos;avancement
        </div>
        <div className="rounded-lg bg-successLight px-3 py-1.5 text-success font-medium">
          ↗ OK — Budget maîtrisé et avancement conforme
        </div>
        <div className="rounded-lg bg-facamBlueTint px-3 py-1.5 text-facamBlue font-medium">
          ↙ DÉBUT — Normal en début de projet
        </div>
        <div className="rounded-lg bg-warningLight px-3 py-1.5 text-warning font-medium">
          ↘ SOUS-ESTIMÉ — Avancement fort, peu de budget consommé
        </div>
      </div>
    </div>
  );
}
