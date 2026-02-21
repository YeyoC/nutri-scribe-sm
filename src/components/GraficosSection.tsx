import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { FoodGroup, MacroTotals } from "@/data/smaeData";

interface GraficosSectionProps {
  groups: FoodGroup[];
  totals: MacroTotals;
  goals: { kcal: number; protein: number; lipids: number; hco: number };
}

const COLORS = [
  "hsl(168, 72%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(210, 80%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(120, 50%, 45%)",
];

const GraficosSection = ({ groups, totals, goals }: GraficosSectionProps) => {
  // Macro distribution pie data
  const proteinKcal = totals.protein * 4;
  const lipidsKcal = totals.lipids * 9;
  const hcoKcal = totals.hco * 4;
  const totalMacroKcal = proteinKcal + lipidsKcal + hcoKcal;

  const macroPieData = [
    { name: "HCO", value: Math.round(hcoKcal), percent: totalMacroKcal > 0 ? Math.round((hcoKcal / totalMacroKcal) * 100) : 0 },
    { name: "Lípidos", value: Math.round(lipidsKcal), percent: totalMacroKcal > 0 ? Math.round((lipidsKcal / totalMacroKcal) * 100) : 0 },
    { name: "Proteína", value: Math.round(proteinKcal), percent: totalMacroKcal > 0 ? Math.round((proteinKcal / totalMacroKcal) * 100) : 0 },
  ];

  // Comparison bar data
  const comparisonData = [
    { name: "Kcal", actual: Math.round(totals.kcal), meta: Math.round(goals.kcal) },
    { name: "Pro (g)", actual: Math.round(totals.protein), meta: Math.round(goals.protein) },
    { name: "Lip (g)", actual: Math.round(totals.lipids), meta: Math.round(goals.lipids) },
    { name: "HCO (g)", actual: Math.round(totals.hco), meta: Math.round(goals.hco) },
  ];

  // Groups with equivalents for pie
  const activeGroups = groups.filter((g) => g.equivalents > 0);
  const groupPieData = activeGroups.map((g) => ({
    name: g.shortName,
    value: g.equivalents,
    kcal: g.kcal * g.equivalents,
  }));

  const hasData = totals.kcal > 0;

  return (
    <div className="space-y-5">
      {/* Macro Pie Chart */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">Distribución de Macronutrientes</h2>
        {hasData ? (
          <div className="flex items-center gap-4">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {macroPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} kcal`, name]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {macroPieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm font-medium text-foreground">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{d.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Agrega equivalentes para ver la distribución
          </p>
        )}
      </div>

      {/* Comparison Chart */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">Actual vs Meta</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Legend />
              <Bar dataKey="actual" name="Actual" fill="hsl(168, 72%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="meta" name="Meta" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Groups Pie Chart */}
      {activeGroups.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-bold text-lg text-foreground mb-4">Kcal por Grupo de Alimento</h2>
          <div className="flex items-center gap-4">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="kcal"
                  >
                    {groupPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} kcal`, name]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1 max-h-48 overflow-y-auto">
              {groupPieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold text-muted-foreground">{d.kcal} kcal</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraficosSection;
