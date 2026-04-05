import { useState } from "react";
import { Sparkles, Loader2, Lock, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { aiTextSchema, checkRateLimit } from "@/lib/security";
import type { SmaeEdition } from "@/components/SmaeEditionSelector";

interface AIAnalysisSectionProps {
  onAnalysis?: (equivalents: { id: string; equivalents: number }[]) => void;
  smaeEdition?: SmaeEdition;
}

const AIAnalysisSection = ({ onAnalysis, smaeEdition = "smae4" }: AIAnalysisSectionProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { canUseAi, aiRemaining, trackAiUsage, plan } = usePlan();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Inicia sesión para usar el análisis con IA");
      navigate("/auth");
      return;
    }

    if (!canUseAi) {
      toast.error(`Alcanzaste el límite de análisis IA de tu plan (${plan}).`);
      return;
    }

    // Validate & sanitize input
    const parsed = aiTextSchema.safeParse(text);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Entrada no válida");
      return;
    }

    // Client-side rate limit: max 5 requests per 60s
    if (!checkRateLimit(`ai_${user.id}`, 5, 60_000)) {
      toast.error("Demasiadas solicitudes. Espera un momento.");
      return;
    }

    setLoading(true);
    try {
      const tracked = await trackAiUsage();
      if (!tracked) {
        toast.error("Límite de análisis IA alcanzado este mes.");
        return;
      }

      const editionLabel = smaeEdition === "smae5" ? "SMAE 5ª edición (2014)" : "SMAE 4ª edición";

      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { text: parsed.data, smaeEdition: editionLabel },
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
        {user && aiRemaining < Infinity && (
          <span className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
            {aiRemaining} restantes
          </span>
        )}
      </div>

      {!user ? (
        <div className="text-center py-6">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Inicia sesión para usar el análisis con IA
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" /> Iniciar sesión
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Describe lo que comes y nuestra IA calculará automáticamente los equivalentes nutricionales según el SMAE.
          </p>
          <textarea
            className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
            maxLength={1000}
            placeholder="Ejemplo: 550g de pechuga de pollo, 4 huevos, 500ml de leche entera... (Ctrl+Enter para enviar)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={loading || !canUseAi}
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">{text.length}/1000</span>
          </div>
          {!canUseAi && (
            <div className="flex items-center gap-2 mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                🔒 Alcanzaste tu límite mensual de análisis IA. Actualiza tu plan para más.
              </p>
            </div>
          )}
          <button
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading || !canUseAi}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analizando..." : "Enviar"}
          </button>
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <p>📊 Cálculo automático de equivalentes SMAE</p>
            <p>🥩 Ejemplo: "1 ración de pechuga" → 1 eq. AOA MBAG</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAnalysisSection;
