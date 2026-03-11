import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMAE_GROUPS = [
  { id: "verduras", name: "Verduras", kcal: 25, protein: 2, lipids: 0, hco: 4 },
  { id: "frutas", name: "Frutas", kcal: 60, protein: 0, lipids: 0, hco: 15 },
  { id: "cereales_sg", name: "Cereales sin grasa", kcal: 70, protein: 2, lipids: 0, hco: 15 },
  { id: "cereales_cg", name: "Cereales con grasa", kcal: 115, protein: 2, lipids: 5, hco: 15 },
  { id: "leguminosas", name: "Leguminosas", kcal: 120, protein: 8, lipids: 1, hco: 20 },
  { id: "aoa_mbag", name: "AOA muy bajo en grasa", kcal: 40, protein: 7, lipids: 1, hco: 0 },
  { id: "aoa_bag", name: "AOA bajo en grasa", kcal: 55, protein: 7, lipids: 3, hco: 0 },
  { id: "aoa_mag", name: "AOA moderado en grasa", kcal: 75, protein: 7, lipids: 5, hco: 0 },
  { id: "aoa_aag", name: "AOA alto en grasa", kcal: 100, protein: 7, lipids: 8, hco: 0 },
  { id: "leche_des", name: "Leche descremada", kcal: 95, protein: 9, lipids: 2, hco: 12 },
  { id: "leche_semi", name: "Leche semidescremada", kcal: 110, protein: 9, lipids: 4, hco: 12 },
  { id: "leche_entera", name: "Leche entera", kcal: 150, protein: 9, lipids: 8, hco: 12 },
  { id: "leche_ca", name: "Leche con azúcar", kcal: 200, protein: 8, lipids: 5, hco: 30 },
  { id: "aceites_sp", name: "Aceites sin proteína", kcal: 45, protein: 0, lipids: 5, hco: 0 },
  { id: "aceites_cp", name: "Aceites con proteína", kcal: 70, protein: 3, lipids: 5, hco: 3 },
  { id: "azucar_sg", name: "Azúcar sin grasa", kcal: 40, protein: 0, lipids: 0, hco: 10 },
  { id: "azucar_cg", name: "Azúcar con grasa", kcal: 85, protein: 0, lipids: 5, hco: 10 },
];

const systemPrompt = `Eres un nutriólogo experto en el Sistema Mexicano de Alimentos Equivalentes (SMAE). Tu trabajo es analizar descripciones de alimentos y convertirlas en equivalentes SMAE.

Los grupos del SMAE y sus IDs son:
${SMAE_GROUPS.map((g) => `- "${g.id}": ${g.name} (1 eq = ${g.kcal} kcal, P:${g.protein}g, L:${g.lipids}g, HCO:${g.hco}g)`).join("\n")}

Pesos de referencia para 1 equivalente de AOA (Alimento de Origen Animal):
- Pechuga de pollo sin piel: ~40g cocida = 1 equivalente AOA muy bajo en grasa (aoa_mbag)
- Huevo entero: 1 pieza (~50g) = 1 equivalente AOA moderado en grasa (aoa_mag)
- Carne de res magra: ~30g = 1 equivalente AOA bajo en grasa (aoa_bag)
- Atún en agua: ~30g = 1 equivalente AOA muy bajo en grasa (aoa_mbag)
- Queso panela: ~40g = 1 equivalente AOA bajo en grasa (aoa_bag)
- Queso Oaxaca: ~30g = 1 equivalente AOA alto en grasa (aoa_aag)

Pesos de referencia para leche:
- 1 vaso de leche (240ml) = 1 equivalente del tipo correspondiente

Pesos de referencia para cereales:
- 1 tortilla de maíz (~30g) = 1 equivalente cereales sin grasa
- 1 rebanada de pan integral (~30g) = 1 equivalente cereales sin grasa
- 1/2 taza de arroz cocido = 1 equivalente cereales sin grasa

Pesos de referencia para frutas:
- 1 pieza mediana de fruta = 1 equivalente de fruta

Pesos de referencia para verduras:
- 1/2 taza de verdura cocida o 1 taza cruda = 1 equivalente de verdura

IMPORTANTE: Calcula los equivalentes proporcionalmente según la cantidad que el usuario indique. Por ejemplo, si dice "550g de pechuga de pollo", eso es 550/40 ≈ 13.75, redondea a 14 equivalentes de aoa_mbag.

Responde ÚNICAMENTE con un JSON array de objetos con las propiedades "id" (el id del grupo SMAE) y "equivalents" (número entero de equivalentes). Solo incluye grupos que tengan equivalentes > 0.

Ejemplo: si el usuario dice "2 huevos y 1 vaso de leche entera", responde:
[{"id":"aoa_mag","equivalents":2},{"id":"leche_entera","equivalents":1}]

No incluyas explicaciones, solo el JSON array.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1000) : "";
    const smaeEdition = typeof body?.smaeEdition === "string" ? body.smaeEdition.slice(0, 50) : "SMAE 4ª edición";

    if (!text || text.length < 3) {
      return new Response(JSON.stringify({ error: "Se requiere texto (mín 3 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const editionContext = `\n\nIMPORTANTE: Usa los valores de referencia de la ${smaeEdition} del Sistema Mexicano de Alimentos Equivalentes.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + editionContext },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const equivalents = JSON.parse(jsonStr);

    // Validate structure
    const validIds = SMAE_GROUPS.map((g) => g.id);
    const validated = equivalents
      .filter((e: any) => validIds.includes(e.id) && typeof e.equivalents === "number" && e.equivalents > 0)
      .map((e: any) => ({ id: e.id, equivalents: Math.round(e.equivalents) }));

    return new Response(JSON.stringify({ equivalents: validated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
