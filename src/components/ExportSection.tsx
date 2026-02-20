import { FileDown, FileText, Trash2 } from "lucide-react";

interface ExportSectionProps {
  hasData: boolean;
}

const ExportSection = ({ hasData }: ExportSectionProps) => {
  return (
    <div className="glass-card p-5">
      <h2 className="font-bold text-lg text-foreground mb-4">Exportar Dieta</h2>
      <div className="flex gap-3">
        <button
          disabled={!hasData}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </button>
        <button
          disabled={!hasData}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4" />
          Word
        </button>
        <button
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
