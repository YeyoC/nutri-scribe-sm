import type { MacroTotals } from "@/data/smaeData";

interface ResultsSectionProps {
  totals: MacroTotals;
  goals: { kcal: number; protein: number; lipids: number; hco: number };
}

const ResultsSection = ({ totals, goals }: ResultsSectionProps) => {
  const pct = (val: number, goal: number) => (goal > 0 ? Math.round((val / goal) * 100) : 0);

  const rows = [
    { label: "Kcal", sum: Math.round(totals.kcal), meta: Math.round(goals.kcal), unit: "" },
    { label: "Pro", sum: Math.round(totals.protein), meta: Math.round(goals.protein), unit: "g" },
    { label: "Lip", sum: Math.round(totals.lipids), meta: Math.round(goals.lipids), unit: "g" },
    { label: "HCO", sum: Math.round(totals.hco), meta: Math.round(goals.hco), unit: "g" },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-foreground">Resultados</h2>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-xs uppercase"></th>
              {rows.map((r) => (
                <th key={r.label} className="py-2 px-3 text-center font-semibold text-muted-foreground text-xs uppercase">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="py-2 px-3 font-medium text-foreground">Suma</td>
              {rows.map((r) => (
                <td key={r.label} className="py-2 px-3 text-center text-foreground">
                  {r.sum}{r.unit}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="py-2 px-3 font-medium text-foreground">Meta</td>
              {rows.map((r) => (
                <td key={r.label} className="py-2 px-3 text-center font-semibold text-primary">
                  {r.meta}{r.unit}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="py-2 px-3 font-medium text-foreground">%</td>
              {rows.map((r) => (
                <td key={r.label} className="py-2 px-3 text-center font-semibold text-primary">
                  {pct(r.sum, r.meta)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        {rows.map((r) => {
          const p = Math.min(100, pct(r.sum, r.meta));
          return (
            <div key={r.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-primary">{r.label}</span>
                <span className="text-muted-foreground">
                  {r.sum} / {r.meta}{r.unit}
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${p}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsSection;
