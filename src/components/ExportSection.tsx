import { FileText, Printer, Trash2 } from "lucide-react";
import type { FoodGroup, MacroTotals } from "@/data/smaeData";

interface ExportSectionProps {
  hasData: boolean;
  groups: FoodGroup[];
  totals: MacroTotals;
  goals: { kcal: number; protein: number; lipids: number; hco: number };
  onClear: () => void;
}

const ExportSection = ({ hasData, groups, totals, goals, onClear }: ExportSectionProps) => {
  const pct = (v: number, g: number) => (g > 0 ? Math.round((v / g) * 100) : 0);

  const generateTextContent = () => {
    const activeGroups = groups.filter((g) => g.equivalents > 0);
    let content = "SUPER NUTREIN — Dietocálculo SMAE\n";
    content += "=".repeat(40) + "\n\n";
    content += "EQUIVALENTES POR GRUPO DE ALIMENTOS\n";
    content += "-".repeat(40) + "\n";
    activeGroups.forEach((g) => {
      content += `${g.name}: ${g.equivalents} eq (${g.kcal * g.equivalents} kcal)\n`;
    });
    content += "\nRESUMEN NUTRICIONAL\n";
    content += "-".repeat(40) + "\n";
    content += `Kcal:     ${Math.round(totals.kcal)} / ${Math.round(goals.kcal)} (${pct(totals.kcal, goals.kcal)}%)\n`;
    content += `Proteína: ${Math.round(totals.protein)}g / ${Math.round(goals.protein)}g (${pct(totals.protein, goals.protein)}%)\n`;
    content += `Lípidos:  ${Math.round(totals.lipids)}g / ${Math.round(goals.lipids)}g (${pct(totals.lipids, goals.lipids)}%)\n`;
    content += `HCO:      ${Math.round(totals.hco)}g / ${Math.round(goals.hco)}g (${pct(totals.hco, goals.hco)}%)\n`;
    content += "\nGenerado por Super Nutrein · " + new Date().toLocaleDateString("es-MX");
    return content;
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generateTextContent()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dietocalculo-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const activeGroups = groups.filter((g) => g.equivalents > 0);
    const rows = activeGroups.map((g) =>
      `<tr><td>${g.name}</td><td style="text-align:center">${g.equivalents} eq</td><td style="text-align:center">${g.kcal * g.equivalents} kcal</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Dietocálculo SMAE — Super Nutrein</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
        h1 { font-size: 20px; color: #0d9488; }
        h2 { font-size: 14px; color: #555; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f0fdfa; color: #0d9488; text-align: left; padding: 8px; border-bottom: 2px solid #0d9488; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .meta { font-size: 12px; color: #888; margin-top: 32px; }
      </style></head><body>
      <h1>Dietocálculo SMAE — Super Nutrein</h1>
      <h2>Equivalentes por grupo de alimentos</h2>
      <table><thead><tr><th>Grupo</th><th>Equivalentes</th><th>Kcal</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <h2>Resumen nutricional</h2>
      <table><thead><tr><th>Macronutriente</th><th>Suma</th><th>Meta</th><th>%</th></tr></thead><tbody>
        <tr><td>Kcal</td><td>${Math.round(totals.kcal)}</td><td>${Math.round(goals.kcal)}</td><td>${pct(totals.kcal, goals.kcal)}%</td></tr>
        <tr><td>Proteína (g)</td><td>${Math.round(totals.protein)}</td><td>${Math.round(goals.protein)}</td><td>${pct(totals.protein, goals.protein)}%</td></tr>
        <tr><td>Lípidos (g)</td><td>${Math.round(totals.lipids)}</td><td>${Math.round(goals.lipids)}</td><td>${pct(totals.lipids, goals.lipids)}%</td></tr>
        <tr><td>HCO (g)</td><td>${Math.round(totals.hco)}</td><td>${Math.round(goals.hco)}</td><td>${pct(totals.hco, goals.hco)}%</td></tr>
      </tbody></table>
      <p class="meta">Generado por Super Nutrein · ${new Date().toLocaleDateString("es-MX")}</p>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); win.close(); }
  };

  return (
    <div className="glass-card p-5">
      <h2 className="font-bold text-lg text-foreground mb-4">Exportar Dieta</h2>
      <div className="flex gap-3">
        <button disabled={!hasData} onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Printer className="w-4 h-4" /> PDF / Imprimir
        </button>
        <button disabled={!hasData} onClick={handleDownloadTxt}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <FileText className="w-4 h-4" /> Exportar .txt
        </button>
        <button onClick={onClear}
          className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2.5 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-4 h-4" /> Borrar
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
