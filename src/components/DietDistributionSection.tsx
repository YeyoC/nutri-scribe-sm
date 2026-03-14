import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { calculateDistribution } from "@/data/smaeData";

interface DietDistributionProps {
  kcalTotal: number;
  onDistributionChange: (goals: { kcal: number; protein: number; lipids: number; hco: number }) => void;
}

const DietDistributionSection = ({ kcalTotal, onDistributionChange }: DietDistributionProps) => {
  const [dietKcal, setDietKcal] = useState(2000);
  const [hcoP, setHcoP] = useState(60);
  const [lipP, setLipP] = useState(25);
  const [proP, setProP] = useState(15);
  const [isAuto, setIsAuto] = useState(false);

  const dist = calculateDistribution({
    kcalTotal: dietKcal,
    hcoPercent: hcoP,
    lipPercent: lipP,
    proPercent: proP,
  });

  // Auto mode: sincronizar kcal desde los totales calculados
  useEffect(() => {
    if (isAuto && kcalTotal > 0) {
      setDietKcal(Math.round(kcalTotal));
    }
  }, [isAuto, kcalTotal]);

  useEffect(() => {
    onDistributionChange({
      kcal: dietKcal,
      protein: dist.pro.grams,
      lipids: dist.lip.grams,
      hco: dist.hco.grams,
    });
  }, [dietKcal, hcoP, lipP, proP]);

  const totalPercent = hcoP + lipP + proP;
  const isValid = totalPercent === 100;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-foreground">Distribución de Dieta</h2>
        <button
          onClick={() => setIsAuto(!isAuto)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity ${
            isAuto ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {isAuto ? "Auto activo" : "Auto"}
        </button>
      </div>

      {/* Dieta input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground">Dieta</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            value={dietKcal}
            onChange={(e) => setDietKcal(Number(e.target.value) || 0)}
            className="flex-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm text-muted-foreground">Kcal</span>
        </div>
      </div>

      {/* Distribution table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-xs uppercase">Macro</th>
              <th className="py-2 px-3 text-center font-semibold text-muted-foreground text-xs uppercase">Porcentaje</th>
              <th className="py-2 px-3 text-center font-semibold text-muted-foreground text-xs uppercase">Kcal</th>
              <th className="py-2 px-3 text-center font-semibold text-muted-foreground text-xs uppercase">Gramos</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "HCO", percent: hcoP, setPercent: setHcoP, data: dist.hco },
              { label: "Lip", percent: lipP, setPercent: setLipP, data: dist.lip },
              { label: "Pro", percent: proP, setPercent: setProP, data: dist.pro },
            ].map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="py-2 px-3 font-medium text-foreground">{row.label}</td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    value={row.percent}
                    onChange={(e) => row.setPercent(Number(e.target.value) || 0)}
                    className="w-16 rounded border border-input bg-background p-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    min={0}
                    max={100}
                  />
                </td>
                <td className="py-2 px-3 text-center font-semibold text-primary">{row.data.kcal}</td>
                <td className="py-2 px-3 text-center text-muted-foreground">{row.data.grams} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-3 text-sm">
        <span className="text-muted-foreground">Total porcentajes:</span>
        <span className={`font-bold ${isValid ? "text-primary" : "text-destructive"}`}>
          {totalPercent}%
        </span>
      </div>
    </div>
  );
};

export default DietDistributionSection;
