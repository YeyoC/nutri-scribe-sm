import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres un experto en nutrición clínica mexicana especializado en el Sistema Mexicano de Alimentos Equivalentes (SMAE).

Tu trabajo es analizar los ingredientes de un platillo y devolver el desglose nutricional EXACTO de cada ingrediente.

Para cada ingrediente debes calcular:
- kcal (kilocalorías)
- proteina_g (gramos de proteína)
- grasas_g (gramos de grasas/lípidos)
- carbos_g (gramos de carbohidratos)
- equivalente_smae (equivalentes SMAE correspondientes, ej: "3.5 AOA MAG", "2 Verduras", "1 Cereales S/G")

Grupos SMAE de referencia:
- Verduras: 1 eq = 25 kcal, P:2g, L:0g, HCO:4g (1/2 taza cocida o 1 taza cruda)
- Frutas: 1 eq = 60 kcal, P:0g, L:0g, HCO:15g (1 pieza mediana)
- Cereales sin grasa: 1 eq = 70 kcal, P:2g, L:0g, HCO:15g (1 tortilla ~30g)
- Cereales con grasa: 1 eq = 115 kcal, P:2g, L:5g, HCO:15g
- Leguminosas: 1 eq = 120 kcal, P:8g, L:1g, HCO:20g
- AOA muy bajo en grasa: 1 eq = 40 kcal, P:7g, L:1g, HCO:0g (pechuga ~40g cocida)
- AOA bajo en grasa: 1 eq = 55 kcal, P:7g, L:3g, HCO:0g (res magra ~30g)
- AOA moderado en grasa: 1 eq = 75 kcal, P:7g, L:5g, HCO:0g (huevo 1 pza ~50g)
- AOA alto en grasa: 1 eq = 100 kcal, P:7g, L:8g, HCO:0g
- Leche descremada: 1 eq = 95 kcal, P:9g, L:2g, HCO:12g (240ml)
- Leche semidescremada: 1 eq = 110 kcal, P:9g, L:4g, HCO:12g
- Leche entera: 1 eq = 150 kcal, P:9g, L:8g, HCO:12g
- Leche con azúcar: 1 eq = 200 kcal, P:8g, L:5g, HCO:30g
- Aceites sin proteína: 1 eq = 45 kcal, P:0g, L:5g, HCO:0g (1 cdita aceite ~5ml)
- Aceites con proteína: 1 eq = 70 kcal, P:3g, L:5g, HCO:3g
- Azúcar sin grasa: 1 eq = 40 kcal, P:0g, L:0g, HCO:10g
- Azúcar con grasa: 1 eq = 85 kcal, P:0g, L:5g, HCO:10g

IMPORTANTE: Calcula proporcionalmente. Ej: 250g pechuga = 250/40 ≈ 6.25 → 6 eq AOA MBAG.

Responde ÚNICAMENTE con un JSON array. Cada objeto tiene:
{
  "ingrediente": string,
  "cantidad": string,
  "kcal": number,
  "proteina_g": number,
  "grasas_g": number,
  "carbos_g": number,
  "equivalente_smae": string,
  "smae_desglose": [{"id": string, "equivalents": number}]
}

El campo "smae_desglose" usa los IDs: verduras, frutas, cereales_sg, cereales_cg, leguminosas, aoa_mbag, aoa_bag, aoa_mag, aoa_aag, leche_des, leche_semi, leche_entera, leche_ca, aceites_sp, aceites_cp, azucar_sg, azucar_cg.

Al final del array, incluye un objeto con ingrediente: "TOTAL" que sume todos los valores.

No incluyas texto adicional, solo el JSON array.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Se requiere texto de ingredientes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
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
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const ingredients = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ ingredients }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-dish error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
