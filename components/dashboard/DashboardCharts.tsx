"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { BarChartItem, PieChartItem } from "./types";

export function DashboardCharts({
  barChartData,
  pieChartData,
}: {
  barChartData: BarChartItem[];
  pieChartData: PieChartItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Bar chart — avancement des projets actifs */}
      <div className="rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-4 text-base font-semibold text-facamDark">
          Avancement des projets actifs
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={barChartData}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#374151" }}
              width={110}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Avancement"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="progress" fill="#001b61" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart — distribution des statuts de tâches */}
      <div className="rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-4 text-base font-semibold text-facamDark">
          Distribution des statuts de tâches
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} tâches`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#6b7280" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
