import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "gratis" | "estudiante" | "profesional";

export const PLAN_LIMITS = {
  gratis: { platillos: 2, ai_monthly: 3 },
  estudiante: { platillos: 15, ai_monthly: 25 },
  profesional: { platillos: Infinity, ai_monthly: Infinity },
} as const;

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("gratis");
  const [aiUsage, setAiUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("gratis");
      setAiUsage(0);
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const [planRes, usageRes] = await Promise.all([
          supabase.from("user_plans").select("plan, expires_at").eq("user_id", user.id).single(),
          supabase.rpc("get_ai_usage_this_month", { p_user_id: user.id }),
        ]);

        if (planRes.data?.plan) {
          const { plan: dbPlan, expires_at } = planRes.data;
          // Si tiene expires_at y ya expiró, degradar a gratis
          if (expires_at && new Date(expires_at) < new Date()) {
            setPlan("gratis");
          } else {
            setPlan(dbPlan as PlanType);
          }
        }
        if (typeof usageRes.data === "number") {
          setAiUsage(usageRes.data);
        }
      } catch {
        // fallback a gratis
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  const trackAiUsage = async () => {
    if (!user) return false;
    const limit = PLAN_LIMITS[plan].ai_monthly;
    if (aiUsage >= limit) return false;

    const { error } = await supabase
      .from("ai_usage_log")
      .insert({ user_id: user.id, action_type: "analyze" });

    if (error) {
      console.error("Error tracking AI usage:", error);
      return false;
    }

    setAiUsage((prev) => prev + 1);
    return true;
  };

  const canUseAi = user ? aiUsage < PLAN_LIMITS[plan].ai_monthly : false;
  const aiRemaining = PLAN_LIMITS[plan].ai_monthly === Infinity
    ? Infinity
    : Math.max(0, PLAN_LIMITS[plan].ai_monthly - aiUsage);

  return { plan, aiUsage, aiRemaining, canUseAi, trackAiUsage, loading, limits: PLAN_LIMITS[plan] };
}
