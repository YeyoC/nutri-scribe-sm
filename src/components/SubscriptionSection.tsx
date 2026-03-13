import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, type PlanType } from "@/hooks/usePlan";
import { toast } from "sonner";
import { CreditCard, Crown, Loader2, ExternalLink, Star, Sparkles } from "lucide-react";

const STRIPE_PLANS = {
  estudiante: {
    priceId: "price_1TAJYwE2E9LRIgi6Kr6MMa5E",
    productId: "prod_U8ak7U5tumzwEt",
    name: "Estudiante",
    price: "$99",
    features: ["Hasta 15 platillos", "25 análisis IA/mes", "Equivalentes SMAE detallados"],
  },
  profesional: {
    priceId: "price_1TAJa8E2E9LRIgi6GdkENTYr",
    productId: "prod_U8alKuBMs88Haq",
    name: "Profesional",
    price: "$199",
    features: ["Platillos ilimitados", "IA ilimitada", "Todas las funciones", "Soporte prioritario"],
  },
} as const;

const SubscriptionSection = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading } = usePlan();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Check subscription on mount and sync
  const syncSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscription_end) {
        setSubscriptionEnd(data.subscription_end);
      }
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    syncSubscription();
  }, [syncSubscription]);

  // Check for checkout success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("¡Suscripción activada! Puede tardar unos segundos en reflejarse.");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Re-sync after a moment
      setTimeout(syncSubscription, 3000);
    } else if (params.get("checkout") === "cancel") {
      toast.info("Checkout cancelado");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [syncSubscription]);

  const handleCheckout = async (planKey: "estudiante" | "profesional") => {
    setCheckingOut(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PLANS[planKey].priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar el checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al abrir el portal de facturación");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (planLoading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const isPaid = plan === "estudiante" || plan === "profesional";

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Mi suscripción</h3>
      </div>

      {/* Current plan badge */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {plan === "profesional" ? <Crown className="w-5 h-5 text-primary" /> :
           plan === "estudiante" ? <Star className="w-5 h-5 text-primary" /> :
           <Sparkles className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div>
          <p className="font-semibold text-foreground capitalize">Plan {plan}</p>
          {subscriptionEnd && isPaid && (
            <p className="text-xs text-muted-foreground">
              Próxima facturación: {new Date(subscriptionEnd).toLocaleDateString("es-MX")}
            </p>
          )}
          {!isPaid && <p className="text-xs text-muted-foreground">Plan gratuito activo</p>}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.entries(STRIPE_PLANS) as [string, typeof STRIPE_PLANS.estudiante][]).map(([key, tier]) => {
          const isActive = plan === key;
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground">{tier.name}</h4>
                {isActive && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tier.price}<span className="text-sm font-normal text-muted-foreground">/mes MXN</span>
              </p>
              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!isActive && (
                <button
                  onClick={() => handleCheckout(key as "estudiante" | "profesional")}
                  disabled={!!checkingOut}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {checkingOut === key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {plan === "gratis" ? "Suscribirme" : "Cambiar plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage subscription */}
      {isPaid && (
        <button
          onClick={handleManageSubscription}
          disabled={loadingPortal}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Administrar suscripción / Cancelar
        </button>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Los pagos son procesados de forma segura por Stripe. Puedes cancelar en cualquier momento.
      </p>
    </div>
  );
};

export default SubscriptionSection;
