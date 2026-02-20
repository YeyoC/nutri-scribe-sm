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
                onClick={() => onChange(g.id, Math.max(0, g.equivalents - 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center border border-input hover:bg-muted transition-colors"
              >
                <Minus className="w-3 h-3 text-muted-foreground" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-primary">{g.equivalents}</span>
              <button
                onClick={() => onChange(g.id, g.equivalents + 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center border border-input hover:bg-muted transition-colors"
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
