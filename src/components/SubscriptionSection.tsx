import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";
import { CreditCard, Crown, Loader2, ExternalLink, Star, Sparkles, Tag } from "lucide-react";

type Duration = 1 | 3 | 6 | 12;

interface PlanOption {
  priceId: string;
  totalPrice: number;
  monthlyBase: number;
  discount: number | null; // percentage
}

interface PlanTier {
  name: string;
  features: string[];
  durations: Record<Duration, PlanOption>;
}

const PLANS: Record<string, PlanTier> = {
  estudiante: {
    name: "Estudiante",
    features: ["Hasta 15 platillos", "25 análisis IA/mes", "Equivalentes SMAE detallados"],
    durations: {
      1:  { priceId: "price_1TAJYwE2E9LRIgi6Kr6MMa5E", totalPrice: 99,  monthlyBase: 99, discount: null },
      3:  { priceId: "price_1TAPrFE2E9LRIgi6j3qXxyy9", totalPrice: 297, monthlyBase: 99, discount: null },
      6:  { priceId: "price_1TAPrbE2E9LRIgi6gsunWAGx", totalPrice: 594, monthlyBase: 99, discount: null },
      12: { priceId: "price_1TAPsjE2E9LRIgi68yByTA8I", totalPrice: 999, monthlyBase: 99, discount: Math.round((1 - 999 / (99 * 12)) * 100) },
    },
  },
  profesional: {
    name: "Profesional",
    features: ["Platillos ilimitados", "IA ilimitada", "Todas las funciones", "Soporte prioritario"],
    durations: {
      1:  { priceId: "price_1TAJa8E2E9LRIgi6GdkENTYr", totalPrice: 199,  monthlyBase: 199, discount: null },
      3:  { priceId: "price_1TAm7XE2E9LRIgi6PLTTkn8A", totalPrice: 500,  monthlyBase: 199, discount: Math.round((1 - 500 / (199 * 3)) * 100) },
      6:  { priceId: "price_1TAm7xE2E9LRIgi6PCcITJKf", totalPrice: 999,  monthlyBase: 199, discount: Math.round((1 - 999 / (199 * 6)) * 100) },
      12: { priceId: "price_1TAmBtE2E9LRIgi6sGKaMMUV", totalPrice: 1999, monthlyBase: 199, discount: Math.round((1 - 1999 / (199 * 12)) * 100) },
    },
  },
};

const DURATION_LABELS: Record<Duration, string> = {
  1: "1 mes",
  3: "3 meses",
  6: "6 meses",
  12: "12 meses",
};

const SubscriptionSection = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading } = usePlan();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<Record<string, Duration>>({
    estudiante: 1,
    profesional: 1,
  });

  const syncSubscription = useCallback(async (sessionId?: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: sessionId ? { session_id: sessionId } : undefined,
      });
      if (!error && data) {
        if (data.subscription_end) setSubscriptionEnd(data.subscription_end);
        if (typeof data.is_recurring === "boolean") setIsRecurring(data.is_recurring);
      }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => { syncSubscription(); }, [syncSubscription]);

  // Handle checkout success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");

    if (checkout === "success" && sessionId) {
      toast.success("¡Pago exitoso! Verificando tu plan...");
      window.history.replaceState({}, "", window.location.pathname);
      // Verify the session and grant access
      setTimeout(() => syncSubscription(sessionId), 2000);
    } else if (checkout === "cancel") {
      toast.info("Checkout cancelado");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [syncSubscription]);

  const handleCheckout = async (planKey: string, duration: Duration) => {
    const option = PLANS[planKey].durations[duration];
    const key = `${planKey}-${duration}`;
    setCheckingOut(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: option.priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
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
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Error al abrir el portal");
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
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {plan === "profesional" ? <Crown className="w-5 h-5 text-primary" /> :
           plan === "estudiante" ? <Star className="w-5 h-5 text-primary" /> :
           <Sparkles className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div>
          <p className="font-semibold text-foreground capitalize">Plan {plan}</p>
          {subscriptionEnd && isPaid && (
            <p className="text-xs text-muted-foreground">
              {isRecurring ? "Próxima facturación" : "Acceso hasta"}: {new Date(subscriptionEnd).toLocaleDateString("es-MX")}
            </p>
          )}
          {!isPaid && <p className="text-xs text-muted-foreground">Plan gratuito activo</p>}
        </div>
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {Object.entries(PLANS).map(([key, tier]) => {
          const isActive = plan === key;
          const duration = selectedDuration[key];
          const option = tier.durations[duration];

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 space-y-4 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-foreground">{tier.name}</h4>
                {isActive && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    ACTIVO
                  </span>
                )}
              </div>

              {/* Duration selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {([1, 3, 6, 12] as Duration[]).map((d) => {
                  const opt = tier.durations[d];
                  const selected = duration === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDuration((prev) => ({ ...prev, [key]: d }))}
                      className={`relative rounded-lg py-2 px-1 text-center transition-all border text-xs font-medium ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {DURATION_LABELS[d]}
                      {opt.discount && (
                        <span className={`absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          selected ? "bg-background text-primary" : "bg-green-500 text-white"
                        }`}>
                          -{opt.discount}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Price display */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  ${option.totalPrice.toLocaleString("es-MX")}
                </span>
                <span className="text-sm text-muted-foreground">
                  MXN / {DURATION_LABELS[duration]}
                </span>
              </div>

              {/* Discount callout */}
              {option.discount && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    ¡Ahorras ${((option.monthlyBase * duration) - option.totalPrice).toLocaleString("es-MX")} MXN! ({option.discount}% de descuento)
                  </span>
                </div>
              )}

              {/* Monthly equivalent for multi-month */}
              {duration > 1 && (
                <p className="text-xs text-muted-foreground">
                  Equivale a <span className="font-semibold text-foreground">${Math.round(option.totalPrice / duration).toLocaleString("es-MX")}/mes</span>
                  {!option.discount && (
                    <span> • Precio regular sin descuento</span>
                  )}
                </p>
              )}

              {/* Features */}
              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isActive && (
                <button
                  onClick={() => handleCheckout(key, duration)}
                  disabled={!!checkingOut}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {checkingOut === `${key}-${duration}` ? (
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
      {isPaid && isRecurring && (
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
