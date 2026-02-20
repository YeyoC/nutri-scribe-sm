import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAnalysisSectionProps {
  onAnalysis?: (equivalents: { id: string; equivalents: number }[]) => void;
}

const AIAnalysisSection = ({ onAnalysis }: AIAnalysisSectionProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Escribe lo que comes para analizar");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { text: text.trim() },
      });

      if (error) throw error;

      if (data?.equivalents && Array.isArray(data.equivalents)) {
        onAnalysis?.(data.equivalents);
        toast.success(`Se encontraron ${data.equivalents.length} grupo(s) de alimentos`);
        setText("");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (e: any) {
      console.error("AI analysis error:", e);
      toast.error("Error al analizar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

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
        Describe lo que comes y nuestra IA calculará automáticamente los equivalentes nutricionales de cada alimento según el SMAE.
      </p>
      <textarea
        className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        rows={3}
        placeholder="Ejemplo: 550g de pechuga de pollo, 4 huevos, 500ml de leche entera..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <button
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading ? "Analizando..." : "Enviar"}
      </button>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p>✨ Análisis ilimitado de alimentos con IA</p>
        <p>📊 Cálculo automático de equivalentes SMAE</p>
        <p>🥩 Ejemplo: "1 ración de pechuga" → 1 eq. AOA MBAG</p>
      </div>
    </div>
  );
};

export default AIAnalysisSection;
