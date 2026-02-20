import { useState } from "react";
import { Sparkles } from "lucide-react";

interface AIAnalysisSectionProps {
  onAnalysis?: (text: string) => void;
}

const AIAnalysisSection = ({ onAnalysis }: AIAnalysisSectionProps) => {
  const [text, setText] = useState("");

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg text-foreground">Analizar con IA</h2>
        <span className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
          Gratis
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Describe lo que comes y nuestra IA calculará automáticamente los equivalentes nutricionales de cada alimento.
      </p>
      <textarea
        className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        rows={3}
        placeholder="Ejemplo: Como actualmente 550g de pechuga de pollo diaria, 4 huevos, 500ml de leche..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity"
        onClick={() => onAnalysis?.(text)}
      >
        <Sparkles className="w-4 h-4" />
        Enviar
      </button>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p>✨ Análisis ilimitado de alimentos con IA</p>
        <p>📊 Cálculo automático de equivalentes</p>
        <p>💾 Historial de dietas guardado</p>
      </div>
    </div>
  );
};

export default AIAnalysisSection;
