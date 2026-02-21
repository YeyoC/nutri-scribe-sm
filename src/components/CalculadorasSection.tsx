import { useState } from "react";
import { Calculator } from "lucide-react";

const CalculadorasSection = () => {
  // IMC
  const [peso, setPeso] = useState<number>(70);
  const [talla, setTalla] = useState<number>(170);

  // TMB & GET
  const [edad, setEdad] = useState<number>(25);
  const [sexo, setSexo] = useState<"hombre" | "mujer">("hombre");
  const [actividadFisica, setActividadFisica] = useState<number>(1.55);

  // IMC calculation
  const tallaM = talla / 100;
  const imc = tallaM > 0 ? peso / (tallaM * tallaM) : 0;

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { label: "Bajo peso", color: "text-info" };
    if (imc < 25) return { label: "Normal", color: "text-primary" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-warning" };
    return { label: "Obesidad", color: "text-destructive" };
  };

  // Peso ideal (Hamwi)
  const pesoIdeal =
    sexo === "hombre"
      ? 48.08 + 2.72 * ((talla - 152.4) / 2.54)
      : 45.36 + 2.27 * ((talla - 152.4) / 2.54);

  // TMB (Harris-Benedict)
  const tmb =
    sexo === "hombre"
      ? 66.47 + 13.75 * peso + 5.003 * talla - 6.755 * edad
      : 655.1 + 9.563 * peso + 1.85 * talla - 4.676 * edad;

  // GET
  const get = tmb * actividadFisica;

  const imcCat = getIMCCategory(imc);

  const actividadOptions = [
    { value: 1.2, label: "Sedentario" },
    { value: 1.375, label: "Ligera" },
    { value: 1.55, label: "Moderada" },
    { value: 1.725, label: "Intensa" },
    { value: 1.9, label: "Muy intensa" },
  ];

  return (
    <div className="space-y-5">
      {/* Datos del paciente */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-foreground">Datos del Paciente</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Peso (kg)</label>
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value) || 0)}
              className="w-full mt-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Talla (cm)</label>
            <input
              type="number"
              value={talla}
              onChange={(e) => setTalla(Number(e.target.value) || 0)}
              className="w-full mt-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Edad (años)</label>
            <input
              type="number"
              value={edad}
              onChange={(e) => setEdad(Number(e.target.value) || 0)}
              className="w-full mt-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Sexo</label>
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value as "hombre" | "mujer")}
              className="w-full mt-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-muted-foreground">Actividad Física</label>
          <select
            value={actividadFisica}
            onChange={(e) => setActividadFisica(Number(e.target.value))}
            className="w-full mt-1 rounded-lg border border-input bg-background p-2 text-center font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {actividadOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.value})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IMC */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">IMC (Índice de Masa Corporal)</h2>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{imc.toFixed(1)}</p>
          <p className={`text-sm font-semibold mt-1 ${imcCat.color}`}>{imcCat.label}</p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
          {[
            { label: "Bajo peso", range: "< 18.5", color: "bg-info/20 text-info" },
            { label: "Normal", range: "18.5 - 24.9", color: "bg-primary/20 text-primary" },
            { label: "Sobrepeso", range: "25 - 29.9", color: "bg-warning/20 text-warning" },
            { label: "Obesidad", range: "≥ 30", color: "bg-destructive/20 text-destructive" },
          ].map((c) => (
            <div key={c.label} className={`rounded-lg p-2 ${c.color}`}>
              <p className="font-semibold">{c.label}</p>
              <p className="opacity-80">{c.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Peso Ideal */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">Peso Ideal (Hamwi)</h2>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{pesoIdeal.toFixed(1)} <span className="text-lg text-muted-foreground">kg</span></p>
          <p className="text-sm text-muted-foreground mt-1">
            Diferencia: <span className={peso - pesoIdeal > 0 ? "text-warning font-semibold" : "text-primary font-semibold"}>
              {(peso - pesoIdeal) > 0 ? "+" : ""}{(peso - pesoIdeal).toFixed(1)} kg
            </span>
          </p>
        </div>
      </div>

      {/* TMB */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">TMB (Tasa Metabólica Basal)</h2>
        <p className="text-xs text-muted-foreground mb-2">Fórmula Harris-Benedict</p>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{Math.round(tmb)} <span className="text-lg text-muted-foreground">kcal/día</span></p>
        </div>
      </div>

      {/* GET */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-lg text-foreground mb-4">GET (Gasto Energético Total)</h2>
        <p className="text-xs text-muted-foreground mb-2">TMB × Factor de Actividad</p>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{Math.round(get)} <span className="text-lg text-muted-foreground">kcal/día</span></p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round(tmb)} × {actividadFisica} = {Math.round(get)} kcal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalculadorasSection;
