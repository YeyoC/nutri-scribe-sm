import { Minus, Plus } from "lucide-react";
import type { FoodGroup } from "@/data/smaeData";

interface FoodGroupListProps {
  groups: FoodGroup[];
  onChange: (id: string, value: number) => void;
}

const FoodGroupList = ({ groups, onChange }: FoodGroupListProps) => {
  return (
    <div className="glass-card p-5">
      <h2 className="font-bold text-lg text-foreground mb-4">Grupos de Alimentos</h2>
      <div className="space-y-1">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-foreground">{g.name}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChange(g.id, Math.max(0, parseFloat((g.equivalents - 0.5).toFixed(1))))}
                className="w-7 h-7 rounded-full flex items-center justify-center border border-input hover:bg-muted transition-colors"
                aria-label={`Reducir ${g.name}`}
              >
                <Minus className="w-3 h-3 text-muted-foreground" />
              </button>
              <input
                type="number"
                value={g.equivalents}
                min={0}
                step={0.5}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) onChange(g.id, val);
                }}
                className="w-14 text-center text-sm font-bold text-primary bg-transparent border-b border-input focus:outline-none focus:border-ring"
                aria-label={`Equivalentes de ${g.name}`}
              />
              <button
                onClick={() => onChange(g.id, parseFloat((g.equivalents + 0.5).toFixed(1)))}
                className="w-7 h-7 rounded-full flex items-center justify-center border border-input hover:bg-muted transition-colors"
                aria-label={`Aumentar ${g.name}`}
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground w-5">eq</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodGroupList;
