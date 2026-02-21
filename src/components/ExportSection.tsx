import { FileDown, FileText, Trash2 } from "lucide-react";
import type { FoodGroup, MacroTotals } from "@/data/smaeData";

interface ExportSectionProps {
  hasData: boolean;
  groups: FoodGroup[];
  totals: MacroTotals;
  goals: { kcal: number; protein: number; lipids: number; hco: number };
  onClear: () => void;
}

const ExportSection = ({ hasData, groups, totals, goals, onClear }: ExportSectionProps) => {
  const generateContent = () => {
    const activeGroups = groups.filter((g) => g.equivalents > 0);
    const pct = (v: number, g: number) => (g > 0 ? Math.round((v / g) * 100) : 0);

    let content = "SUPER NUTREIN - Dietocálculo SMAE\n";
    content += "=".repeat(40) + "\n\n";
    content += "EQUIVALENTES POR GRUPO DE ALIMENTOS\n";
    content += "-".repeat(40) + "\n";
    activeGroups.forEach((g) => {
      content += `${g.name}: ${g.equivalents} eq (${g.kcal * g.equivalents} kcal)\n`;
    });
    content += "\nRESUMEN NUTRICIONAL\n";
    content += "-".repeat(40) + "\n";
    content += `Kcal: ${Math.round(totals.kcal)} / ${Math.round(goals.kcal)} (${pct(totals.kcal, goals.kcal)}%)\n`;
    content += `Proteína: ${Math.round(totals.protein)}g / ${Math.round(goals.protein)}g (${pct(totals.protein, goals.protein)}%)\n`;
    content += `Lípidos: ${Math.round(totals.lipids)}g / ${Math.round(goals.lipids)}g (${pct(totals.lipids, goals.lipids)}%)\n`;
    content += `HCO: ${Math.round(totals.hco)}g / ${Math.round(goals.hco)}g (${pct(totals.hco, goals.hco)}%)\n`;

    return content;
  };

  const handleDownloadTxt = (ext: string) => {
    const content = generateContent();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dietocalculo.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-5">
      <h2 className="font-bold text-lg text-foreground mb-4">Exportar Dieta</h2>
      <div className="flex gap-3">
        <button
          disabled={!hasData}
          onClick={() => handleDownloadTxt("pdf.txt")}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </button>
        <button
          disabled={!hasData}
          onClick={() => handleDownloadTxt("doc.txt")}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4" />
          Word
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2.5 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Borrar
        </button>
      </div>
      {!hasData && (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Agrega equivalentes para habilitar la exportación
        </p>
      )}
    </div>
  );
};

export default ExportSection;
