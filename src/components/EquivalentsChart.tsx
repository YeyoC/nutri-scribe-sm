import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FoodGroup, MacroTotals } from "@/data/smaeData";

interface EquivalentsChartProps {
  groups: FoodGroup[];
  totals: MacroTotals;
}

const EquivalentsChart = ({ groups, totals }: EquivalentsChartProps) => {
  const chartData = groups.map((g) => ({
    name: g.shortName,
    equivalentes: g.equivalents,
  }));

  const maxVal = Math.max(10, ...groups.map((g) => g.equivalents));

  return (
    <div className="glass-card p-5">
      <h2 className="font-bold text-lg text-foreground mb-4">Gráfico de Equivalentes</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 90%)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "hsl(220 10% 50%)" }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }}
              domain={[0, maxVal]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(210 15% 90%)",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="equivalentes"
              fill="hsl(168 72% 40%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macro summary cards */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[
          { label: "Kcal", value: totals.kcal, unit: "", color: "text-foreground" },
          { label: "Proteína", value: totals.protein, unit: "g", color: "text-primary" },
          { label: "Lípidos", value: totals.lipids, unit: "g", color: "text-warning" },
          { label: "HCO", value: totals.hco, unit: "g", color: "text-info" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>
              {Math.round(m.value)}
              {m.unit && <span className="text-sm font-normal">{m.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquivalentsChart;
