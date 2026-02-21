import { useState, useMemo } from "react";
import { Utensils } from "lucide-react";
import type { FoodGroup } from "@/data/smaeData";

interface DietaSectionProps {
  groups: FoodGroup[];
}

interface MealDistribution {
  [mealId: string]: { [groupId: string]: number };
}

const MEALS = [
  { id: "desayuno", label: "Desayuno" },
  { id: "colacion1", label: "Colación 1" },
  { id: "comida", label: "Comida" },
  { id: "colacion2", label: "Colación 2" },
  { id: "cena", label: "Cena" },
];

const DietaSection = ({ groups }: DietaSectionProps) => {
  const activeGroups = groups.filter((g) => g.equivalents > 0);

  const [distribution, setDistribution] = useState<MealDistribution>(() => {
    const init: MealDistribution = {};
    MEALS.forEach((m) => {
      init[m.id] = {};
    });
    return init;
  });

  const handleChange = (mealId: string, groupId: string, value: number) => {
    setDistribution((prev) => ({
      ...prev,
      [mealId]: {
        ...prev[mealId],
        [groupId]: Math.max(0, value),
      },
    }));
  };

  // Calculate totals per group across meals
  const groupTotals = useMemo(() => {
    const totals: { [groupId: string]: number } = {};
    activeGroups.forEach((g) => {
      totals[g.id] = MEALS.reduce(
        (sum, m) => sum + (distribution[m.id]?.[g.id] || 0),
        0
      );
    });
    return totals;
  }, [distribution, activeGroups]);

  // Calculate kcal per meal
  const mealKcals = useMemo(() => {
    const result: { [mealId: string]: number } = {};
    MEALS.forEach((m) => {
      result[m.id] = activeGroups.reduce((sum, g) => {
        const eqs = distribution[m.id]?.[g.id] || 0;
        return sum + eqs * g.kcal;
      }, 0);
    });
    return result;
  }, [distribution, activeGroups]);

  if (activeGroups.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-foreground">Distribución de Dieta por Tiempos</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Agrega equivalentes en la sección de Dietocálculo para distribuirlos por tiempos de comida.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg text-foreground">Distribución de Dieta por Tiempos</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="py-2 px-2 text-left font-semibold text-muted-foreground text-xs uppercase sticky left-0 bg-muted/50">
                Grupo
              </th>
              <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
                Total
              </th>
              {MEALS.map((m) => (
                <th key={m.id} className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
                  {m.label}
                </th>
              ))}
              <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
                Dist.
              </th>
              <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
                Rest.
              </th>
            </tr>
          </thead>
          <tbody>
            {activeGroups.map((g) => {
              const distributed = groupTotals[g.id] || 0;
              const remaining = g.equivalents - distributed;

              return (
                <tr key={g.id} className="border-t border-border">
                  <td className="py-2 px-2 font-medium text-foreground text-xs sticky left-0 bg-card">
                    {g.shortName}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-primary">{g.equivalents}</td>
                  {MEALS.map((m) => (
                    <td key={m.id} className="py-1 px-1 text-center">
                      <input
                        type="number"
                        min={0}
                        value={distribution[m.id]?.[g.id] || 0}
                        onChange={(e) =>
                          handleChange(m.id, g.id, Number(e.target.value) || 0)
                        }
                        className="w-12 rounded border border-input bg-background p-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center font-semibold text-foreground">{distributed}</td>
                  <td
                    className={`py-2 px-2 text-center font-semibold ${
                      remaining < 0
                        ? "text-destructive"
                        : remaining === 0
                        ? "text-primary"
                        : "text-warning"
                    }`}
                  >
                    {remaining}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="py-2 px-2 font-bold text-foreground text-xs sticky left-0 bg-muted/30">
                Kcal
              </td>
              <td className="py-2 px-2 text-center font-bold text-primary">
                {activeGroups.reduce((s, g) => s + g.kcal * g.equivalents, 0)}
              </td>
              {MEALS.map((m) => (
                <td key={m.id} className="py-2 px-2 text-center font-bold text-primary text-xs">
                  {mealKcals[m.id] || 0}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-bold text-foreground">
                {Object.values(mealKcals).reduce((s, v) => s + v, 0)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DietaSection;
