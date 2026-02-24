import { useState, useCallback, useMemo } from "react";
import {
  ChefHat, Plus, Sparkles, Loader2, Trash2, Eye, UtensilsCrossed,
  ArrowLeft, Save, Search, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ingredient {
  ingrediente: string;
  cantidad: string;
  kcal: number;
  proteina_g: number;
  grasas_g: number;
  carbos_g: number;
  equivalente_smae: string;
  smae_desglose?: { id: string; equivalents: number }[];
}

interface Platillo {
  id: string;
  nombre: string;
  descripcion: string;
  ingredientes: Ingredient[];
  total_kcal: number;
  total_proteina: number;
  total_grasas: number;
  total_carbos: number;
  created_at: string;
}

interface PlatillosSectionProps {
  onUsarEnDieta: (equivalents: { id: string; equivalents: number }[]) => void;
}

type PlanType = "gratis" | "estudiante" | "profesional";

const PLAN_LIMITS: Record<PlanType, number> = {
  gratis: 3,
  estudiante: 30,
  profesional: Infinity,
};

const STORAGE_KEY = "supernutrein_platillos";
const PLAN_KEY = "supernutrein_plan";

function loadPlatillos(): Platillo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function savePlatillos(p: Platillo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function loadPlan(): PlanType {
  return (localStorage.getItem(PLAN_KEY) as PlanType) || "gratis";
}

type View = "list" | "create" | "detail";

const PlatillosSection = ({ onUsarEnDieta }: PlatillosSectionProps) => {
  const [view, setView] = useState<View>("list");
  const [platillos, setPlatillos] = useState<Platillo[]>(loadPlatillos);
  const [plan] = useState<PlanType>(loadPlan);
  const [search, setSearch] = useState("");

  // Create form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [analysisResult, setAnalysisResult] = useState<Ingredient[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detail view
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!descripcion.trim()) {
      toast.error("Escribe los ingredientes del platillo");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-dish", {
        body: { text: descripcion.trim() },
      });
      if (error) throw error;
      if (data?.ingredients && Array.isArray(data.ingredients)) {
        setAnalysisResult(data.ingredients);
        toast.success("Análisis completado");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (e) {
      console.error("Dish analysis error:", e);
      toast.error("Error al analizar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [descripcion]);

  const handleSave = useCallback(() => {
    if (!nombre.trim()) {
      toast.error("Escribe el nombre del platillo");
      return;
    }
    if (!editingId && platillos.length >= PLAN_LIMITS[plan]) {
      toast.error("Alcanzaste el límite de platillos en tu plan actual.");
      return;
    }
    if (!analysisResult || analysisResult.length === 0) {
      toast.error("Primero analiza los ingredientes con IA");
      return;
    }

    const totalRow = analysisResult.find((i) => i.ingrediente === "TOTAL");
    const ingredientRows = analysisResult.filter((i) => i.ingrediente !== "TOTAL");

    const platillo: Platillo = {
      id: editingId || crypto.randomUUID(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      ingredientes: ingredientRows,
      total_kcal: totalRow?.kcal || ingredientRows.reduce((s, i) => s + i.kcal, 0),
      total_proteina: totalRow?.proteina_g || ingredientRows.reduce((s, i) => s + i.proteina_g, 0),
      total_grasas: totalRow?.grasas_g || ingredientRows.reduce((s, i) => s + i.grasas_g, 0),
      total_carbos: totalRow?.carbos_g || ingredientRows.reduce((s, i) => s + i.carbos_g, 0),
      created_at: editingId
        ? platillos.find((p) => p.id === editingId)?.created_at || new Date().toISOString()
        : new Date().toISOString(),
    };

    const updated = editingId
      ? platillos.map((p) => (p.id === editingId ? platillo : p))
      : [...platillos, platillo];

    setPlatillos(updated);
    savePlatillos(updated);
    toast.success(editingId ? "Platillo actualizado ✅" : "Platillo guardado correctamente ✅");
    resetForm();
    setView("list");
  }, [nombre, descripcion, analysisResult, editingId, platillos]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = platillos.filter((p) => p.id !== id);
      setPlatillos(updated);
      savePlatillos(updated);
      toast.success("Platillo eliminado");
      if (selectedPlatillo?.id === id) {
        setSelectedPlatillo(null);
        setView("list");
      }
    },
    [platillos, selectedPlatillo]
  );

  const handleUsarEnDieta = useCallback(
    (platillo: Platillo) => {
      const allEquivs: { [id: string]: number } = {};
      platillo.ingredientes.forEach((ing) => {
        if (ing.smae_desglose) {
          ing.smae_desglose.forEach((s) => {
            allEquivs[s.id] = (allEquivs[s.id] || 0) + s.equivalents;
          });
        }
      });
      const equivArray = Object.entries(allEquivs).map(([id, equivalents]) => ({
        id,
        equivalents,
      }));
      if (equivArray.length > 0) {
        onUsarEnDieta(equivArray);
        toast.success("Platillo agregado a tu dieta actual ✅");
      } else {
        toast.info("Este platillo no tiene desglose SMAE detallado para agregar.");
      }
    },
    [onUsarEnDieta]
  );

  const handleEdit = useCallback(
    (platillo: Platillo) => {
      setNombre(platillo.nombre);
      setDescripcion(platillo.descripcion);
      setAnalysisResult(platillo.ingredientes);
      setEditingId(platillo.id);
      setView("create");
    },
    []
  );

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setAnalysisResult(null);
    setEditingId(null);
  };

  const filtered = platillos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const limit = PLAN_LIMITS[plan];
  const atLimit = platillos.length >= limit;

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg text-foreground">Mis Platillos</h2>
              <span className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                {platillos.length}{limit < Infinity ? `/${limit}` : ""}
              </span>
            </div>
            {atLimit ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-muted text-muted-foreground font-semibold px-4 py-2 text-sm cursor-not-allowed">
                <Lock className="w-4 h-4" />
                Límite alcanzado
              </span>
            ) : (
              <button
                onClick={() => {
                  resetForm();
                  setView("create");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Nuevo platillo
              </button>
            )}
          </div>

          {/* Limit banner */}
          {atLimit && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
              <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  🔒 Alcanzaste el límite de {limit} platillo{limit > 1 ? "s" : ""} en plan{" "}
                  <span className="capitalize">{plan}</span>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actualiza tu plan para guardar más platillos. Puedes seguir viendo y usando los que ya tienes.
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {platillos.length === 0
                  ? "Aún no tienes platillos. ¡Crea tu primero!"
                  : "No se encontraron platillos."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-border bg-background p-4 space-y-2"
                >
                  <h3 className="font-semibold text-foreground text-sm truncate">{p.nombre}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      {Math.round(p.total_kcal)} kcal
                    </span>
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      P: {p.total_proteina.toFixed(1)}g
                    </span>
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      G: {p.total_grasas.toFixed(1)}g
                    </span>
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      C: {p.total_carbos.toFixed(1)}g
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("es-MX")}
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setSelectedPlatillo(p);
                        setView("detail");
                      }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-input hover:bg-muted transition-colors text-foreground"
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-input hover:bg-muted transition-colors text-foreground"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleUsarEnDieta(p)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <UtensilsCrossed className="w-3 h-3" /> Usar en dieta
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs font-medium px-2 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && selectedPlatillo) {
    return (
      <div className="space-y-5">
        <div className="glass-card p-5">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a platillos
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg text-foreground">{selectedPlatillo.nombre}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Creado: {new Date(selectedPlatillo.created_at).toLocaleDateString("es-MX")}
              </p>
            </div>
            <button
              onClick={() => handleUsarEnDieta(selectedPlatillo)}
              className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              <UtensilsCrossed className="w-4 h-4" /> Usar en dieta
            </button>
          </div>

          {/* Totals summary */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Kcal", value: Math.round(selectedPlatillo.total_kcal) },
              { label: "Proteína", value: `${selectedPlatillo.total_proteina.toFixed(1)}g` },
              { label: "Grasas", value: `${selectedPlatillo.total_grasas.toFixed(1)}g` },
              { label: "Carbos", value: `${selectedPlatillo.total_carbos.toFixed(1)}g` },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center rounded-lg bg-muted/50 py-2.5"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-bold text-foreground text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Ingredients table */}
          <IngredientTable ingredients={selectedPlatillo.ingredientes} />
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ──
  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <button
          onClick={() => {
            resetForm();
            setView("list");
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a platillos
        </button>
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-foreground">
            {editingId ? "Editar platillo" : "Nuevo platillo"}
          </h2>
        </div>

        {/* Part 1: Basic info */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Nombre del platillo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Pechuga con verduras asadas"
            className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Part 2: Ingredients */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Ingredientes
          </label>
          <textarea
            className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={4}
            placeholder="Escribe los ingredientes y cantidades, por ejemplo: 250g de pechuga de pollo, 1 zanahoria mediana, 1 calabaza verde, 1 cucharada de aceite de oliva..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Analizando..." : "✨ Analizar con IA"}
        </button>

        {/* Analysis Result */}
        {analysisResult && analysisResult.length > 0 && (
          <div className="mt-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">
              Desglose nutricional
            </h3>

            <IngredientTable
              ingredients={analysisResult.filter((i) => i.ingrediente !== "TOTAL")}
            />

            {/* Totals row */}
            {(() => {
              const totalRow = analysisResult.find((i) => i.ingrediente === "TOTAL");
              const ingredientRows = analysisResult.filter((i) => i.ingrediente !== "TOTAL");
              const kcal = totalRow?.kcal || ingredientRows.reduce((s, i) => s + i.kcal, 0);
              const pro = totalRow?.proteina_g || ingredientRows.reduce((s, i) => s + i.proteina_g, 0);
              const gra = totalRow?.grasas_g || ingredientRows.reduce((s, i) => s + i.grasas_g, 0);
              const car = totalRow?.carbos_g || ingredientRows.reduce((s, i) => s + i.carbos_g, 0);
              return (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { label: "Kcal", value: Math.round(kcal), color: "text-primary" },
                    { label: "Proteína", value: `${pro.toFixed(1)}g`, color: "text-foreground" },
                    { label: "Grasas", value: `${gra.toFixed(1)}g`, color: "text-foreground" },
                    { label: "Carbos", value: `${car.toFixed(1)}g`, color: "text-foreground" },
                  ].map((item) => (
                    <div key={item.label} className="text-center rounded-lg bg-primary/10 py-2.5">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Macro bars */}
            {(() => {
              const totalRow = analysisResult.find((i) => i.ingrediente === "TOTAL");
              const ingredientRows = analysisResult.filter((i) => i.ingrediente !== "TOTAL");
              const kcal = totalRow?.kcal || ingredientRows.reduce((s, i) => s + i.kcal, 0);
              const pro = totalRow?.proteina_g || ingredientRows.reduce((s, i) => s + i.proteina_g, 0);
              const gra = totalRow?.grasas_g || ingredientRows.reduce((s, i) => s + i.grasas_g, 0);
              const car = totalRow?.carbos_g || ingredientRows.reduce((s, i) => s + i.carbos_g, 0);
              if (kcal === 0) return null;
              const proP = ((pro * 4) / kcal) * 100;
              const graP = ((gra * 9) / kcal) * 100;
              const carP = ((car * 4) / kcal) * 100;
              return (
                <div className="space-y-2 mt-4">
                  <MacroBar label="Proteína" percent={proP} />
                  <MacroBar label="Grasas" percent={graP} />
                  <MacroBar label="Carbohidratos" percent={carP} />
                </div>
              );
            })()}

            <button
              onClick={handleSave}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              💾 Guardar platillo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ──

function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="py-2 px-2 text-left font-semibold text-muted-foreground text-xs uppercase">
              Ingrediente
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Cantidad
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Kcal
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Proteína
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Grasas
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Carbos
            </th>
            <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">
              Equiv. SMAE
            </th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing, idx) => (
            <tr key={idx} className="border-t border-border">
              <td className="py-2 px-2 font-medium text-foreground text-xs">
                {ing.ingrediente}
              </td>
              <td className="py-2 px-2 text-center text-xs text-muted-foreground">
                {ing.cantidad}
              </td>
              <td className="py-2 px-2 text-center text-xs font-semibold text-primary">
                {Math.round(ing.kcal)}
              </td>
              <td className="py-2 px-2 text-center text-xs text-foreground">
                {ing.proteina_g.toFixed(1)}g
              </td>
              <td className="py-2 px-2 text-center text-xs text-foreground">
                {ing.grasas_g.toFixed(1)}g
              </td>
              <td className="py-2 px-2 text-center text-xs text-foreground">
                {ing.carbos_g.toFixed(1)}g
              </td>
              <td className="py-2 px-2 text-center text-xs text-accent-foreground font-medium">
                {ing.equivalente_smae}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MacroBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{percent.toFixed(1)}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

export default PlatillosSection;
