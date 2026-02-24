import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, ArrowLeft, Loader2 } from "lucide-react";

interface Ingredient {
  ingrediente: string;
  cantidad: string;
  kcal: number;
  proteina_g: number;
  grasas_g: number;
  carbos_g: number;
  equivalente_smae: string;
}

interface PlatilloPublic {
  nombre: string;
  descripcion: string | null;
  ingredientes: Ingredient[];
  total_kcal: number;
  total_proteina: number;
  total_grasas: number;
  total_carbos: number;
  edicion_smae: string | null;
  created_at: string;
}

const PlatilloPublico = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [platillo, setPlatillo] = useState<PlatilloPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    const fetchPlatillo = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("platillos")
        .select("nombre, descripcion, ingredientes, total_kcal, total_proteina, total_grasas, total_carbos, edicion_smae, created_at")
        .eq("link_compartir", uuid)
        .eq("es_publico", true)
        .single();

      if (err || !data) {
        setError(true);
      } else {
        setPlatillo({
          ...data,
          total_kcal: Number(data.total_kcal) || 0,
          total_proteina: Number(data.total_proteina) || 0,
          total_grasas: Number(data.total_grasas) || 0,
          total_carbos: Number(data.total_carbos) || 0,
          ingredientes: (data.ingredientes as unknown as Ingredient[]) || [],
        });
      }
      setLoading(false);
    };
    fetchPlatillo();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !platillo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <ChefHat className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Platillo no encontrado</h1>
        <p className="text-sm text-muted-foreground text-center">
          Este enlace no es válido o el platillo ya no está disponible.
        </p>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
        >
          <ArrowLeft className="w-4 h-4" /> Ir a Super Nutrein
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-14 px-4 gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              SN
            </div>
            <span className="font-bold text-lg text-primary hidden sm:inline">Super Nutrein</span>
          </Link>
          <span className="text-muted-foreground text-sm">/ Platillo compartido</span>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="glass-card p-5 space-y-4">
          <div>
            <h1 className="font-bold text-xl text-foreground">{platillo.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {new Date(platillo.created_at).toLocaleDateString("es-MX")}
              </p>
              {platillo.edicion_smae && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {platillo.edicion_smae}
                </span>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Kcal", value: Math.round(platillo.total_kcal) },
              { label: "Proteína", value: `${platillo.total_proteina.toFixed(1)}g` },
              { label: "Grasas", value: `${platillo.total_grasas.toFixed(1)}g` },
              { label: "Carbos", value: `${platillo.total_carbos.toFixed(1)}g` },
            ].map((item) => (
              <div key={item.label} className="text-center rounded-lg bg-muted/50 py-2.5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-bold text-foreground text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="py-2 px-2 text-left font-semibold text-muted-foreground text-xs uppercase">Ingrediente</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Cantidad</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Kcal</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Proteína</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Grasas</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Carbos</th>
                  <th className="py-2 px-2 text-center font-semibold text-muted-foreground text-xs uppercase">Equiv. SMAE</th>
                </tr>
              </thead>
              <tbody>
                {platillo.ingredientes.map((ing, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-2 px-2 font-medium text-foreground text-xs">{ing.ingrediente}</td>
                    <td className="py-2 px-2 text-center text-xs text-muted-foreground">{ing.cantidad}</td>
                    <td className="py-2 px-2 text-center text-xs font-semibold text-primary">{Math.round(ing.kcal)}</td>
                    <td className="py-2 px-2 text-center text-xs text-foreground">{ing.proteina_g.toFixed(1)}g</td>
                    <td className="py-2 px-2 text-center text-xs text-foreground">{ing.grasas_g.toFixed(1)}g</td>
                    <td className="py-2 px-2 text-center text-xs text-foreground">{ing.carbos_g.toFixed(1)}g</td>
                    <td className="py-2 px-2 text-center text-xs text-accent-foreground font-medium">{ing.equivalente_smae}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ChefHat className="w-4 h-4" /> Crea tus propios platillos en Super Nutrein
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlatilloPublico;
