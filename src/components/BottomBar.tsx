import type { MacroTotals } from "@/data/smaeData";
import { TrendingDown } from "lucide-react";

interface BottomBarProps {
  totals: MacroTotals;
  goals: { kcal: number; protein: number; lipids: number; hco: number };
}

const BottomBar = ({ totals, goals }: BottomBarProps) => {
  const items = [
    { label: "KCAL", value: Math.round(totals.kcal), unit: "Kcal", meta: Math.round(goals.kcal), metaUnit: "Kcal" },
    { label: "PRO", value: Math.round(totals.protein), unit: "g", meta: Math.round(goals.protein), metaUnit: "g" },
    { label: "LIP", value: Math.round(totals.lipids), unit: "g", meta: Math.round(goals.lipids), metaUnit: "g" },
    { label: "HCO", value: Math.round(totals.hco), unit: "g", meta: Math.round(goals.hco), metaUnit: "g" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const pct = item.meta > 0 ? Math.round((item.value / item.meta) * 100) : 0;
          return (
            <div key={item.label} className="flex flex-col items-center min-w-0">
              <span className="text-xs font-bold text-primary">{item.label}</span>
              <span className="text-lg font-bold text-foreground leading-tight">
                {item.value} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Meta: {item.meta}{item.metaUnit}</span>
                <TrendingDown className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-primary">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottomBar;
