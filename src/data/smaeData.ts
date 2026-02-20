// Datos nutricionales por equivalente según el Sistema Mexicano de Alimentos Equivalentes (SMAE)
// Fuente: Pérez Lizaur AB, Palacios González B, Castro Becerra AL, Flores Galicia I.
// Sistema Mexicano de Alimentos Equivalentes. Fomento de Nutrición y Salud, A.C.

export interface FoodGroup {
  id: string;
  name: string;
  shortName: string;
  kcal: number;
  protein: number; // gramos
  lipids: number;  // gramos
  hco: number;     // gramos (hidratos de carbono)
  equivalents: number;
}

// Valores energéticos por equivalente de cada grupo de alimentos (SMAE)
export const SMAE_GROUPS: FoodGroup[] = [
  { id: "verduras", name: "Verduras", shortName: "Verdu", kcal: 25, protein: 2, lipids: 0, hco: 4, equivalents: 0 },
  { id: "frutas", name: "Frutas", shortName: "Frut", kcal: 60, protein: 0, lipids: 0, hco: 15, equivalents: 0 },
  { id: "cereales_sg", name: "Cereales S/G", shortName: "C.S/G", kcal: 70, protein: 2, lipids: 0, hco: 15, equivalents: 0 },
  { id: "cereales_cg", name: "Cereales C/G", shortName: "C.C/G", kcal: 115, protein: 2, lipids: 5, hco: 15, equivalents: 0 },
  { id: "leguminosas", name: "Leguminosas", shortName: "Legum", kcal: 120, protein: 8, lipids: 1, hco: 20, equivalents: 0 },
  { id: "aoa_mbag", name: "AOA MBAG", shortName: "A.MBAG", kcal: 40, protein: 7, lipids: 1, hco: 0, equivalents: 0 },
  { id: "aoa_bag", name: "AOA BAG", shortName: "A.BAG", kcal: 55, protein: 7, lipids: 3, hco: 0, equivalents: 0 },
  { id: "aoa_mag", name: "AOA MAG", shortName: "A.MAG", kcal: 75, protein: 7, lipids: 5, hco: 0, equivalents: 0 },
  { id: "aoa_aag", name: "AOA AAG", shortName: "A.AAG", kcal: 100, protein: 7, lipids: 8, hco: 0, equivalents: 0 },
  { id: "leche_des", name: "Leche Des", shortName: "L.Des", kcal: 95, protein: 9, lipids: 2, hco: 12, equivalents: 0 },
  { id: "leche_semi", name: "Leche Semi", shortName: "L.Semi", kcal: 110, protein: 9, lipids: 4, hco: 12, equivalents: 0 },
  { id: "leche_entera", name: "Leche Entera", shortName: "L.Ent", kcal: 150, protein: 9, lipids: 8, hco: 12, equivalents: 0 },
  { id: "leche_ca", name: "Leche C/A", shortName: "L.C/A", kcal: 200, protein: 8, lipids: 5, hco: 30, equivalents: 0 },
  { id: "aceites_sp", name: "Aceites S/P", shortName: "Ac.S/P", kcal: 45, protein: 0, lipids: 5, hco: 0, equivalents: 0 },
  { id: "aceites_cp", name: "Aceites C/P", shortName: "Ac.C/P", kcal: 70, protein: 3, lipids: 5, hco: 3, equivalents: 0 },
  { id: "azucar_sg", name: "Azúcar S/G", shortName: "Az.S/G", kcal: 40, protein: 0, lipids: 0, hco: 10, equivalents: 0 },
  { id: "azucar_cg", name: "Azúcar C/G", shortName: "Az.C/G", kcal: 85, protein: 0, lipids: 5, hco: 10, equivalents: 0 },
];

export interface MacroTotals {
  kcal: number;
  protein: number;
  lipids: number;
  hco: number;
}

export function calculateTotals(groups: FoodGroup[]): MacroTotals {
  return groups.reduce(
    (acc, g) => ({
      kcal: acc.kcal + g.kcal * g.equivalents,
      protein: acc.protein + g.protein * g.equivalents,
      lipids: acc.lipids + g.lipids * g.equivalents,
      hco: acc.hco + g.hco * g.equivalents,
    }),
    { kcal: 0, protein: 0, lipids: 0, hco: 0 }
  );
}

export interface DietDistribution {
  kcalTotal: number;
  hcoPercent: number;
  lipPercent: number;
  proPercent: number;
}

export function calculateDistribution(dist: DietDistribution) {
  const hcoKcal = dist.kcalTotal * (dist.hcoPercent / 100);
  const lipKcal = dist.kcalTotal * (dist.lipPercent / 100);
  const proKcal = dist.kcalTotal * (dist.proPercent / 100);

  return {
    hco: { percent: dist.hcoPercent, kcal: Math.round(hcoKcal), grams: +(hcoKcal / 4).toFixed(1) },
    lip: { percent: dist.lipPercent, kcal: Math.round(lipKcal), grams: +(lipKcal / 9).toFixed(1) },
    pro: { percent: dist.proPercent, kcal: Math.round(proKcal), grams: +(proKcal / 4).toFixed(1) },
    totalPercent: dist.hcoPercent + dist.lipPercent + dist.proPercent,
  };
}
