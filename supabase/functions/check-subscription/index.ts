import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps price IDs to plan info
const PRICE_MAP: Record<string, { plan: string; months: number }> = {
  // Estudiante
  "price_1TAJYwE2E9LRIgi6Kr6MMa5E": { plan: "estudiante", months: 1 },
  "price_1TAPrFE2E9LRIgi6j3qXxyy9": { plan: "estudiante", months: 3 },
  "price_1TAPrbE2E9LRIgi6gsunWAGx": { plan: "estudiante", months: 6 },
  "price_1TAPsjE2E9LRIgi68yByTA8I": { plan: "estudiante", months: 12 },
  // Profesional
  "price_1TAJa8E2E9LRIgi6GdkENTYr": { plan: "profesional", months: 1 },
  "price_1TAm7XE2E9LRIgi6PLTTkn8A": { plan: "profesional", months: 3 },
  "price_1TAm7xE2E9LRIgi6PCcITJKf": { plan: "profesional", months: 6 },
  "price_1TAmBtE2E9LRIgi6sGKaMMUV": { plan: "profesional", months: 12 },
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUB] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("No autenticado");
    logStep("User authenticated", { userId: user.id });

    // Check for session_id to verify a recent payment
    let sessionId: string | null = null;
    try {
      const body = await req.json();
      sessionId = body?.session_id || null;
    } catch { /* no body */ }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If session_id provided, verify and grant access
    if (sessionId) {
      logStep("Verifying checkout session", { sessionId });
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        // Find the price used
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        const planInfo = priceId ? PRICE_MAP[priceId] : null;

        if (planInfo) {
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + planInfo.months);

          // For monthly subscriptions, expires_at is managed by Stripe
          const isSubscription = session.mode === "subscription";

          await supabaseAdmin.from("user_plans").update({
            plan: planInfo.plan,
            expires_at: isSubscription ? null : expiresAt.toISOString(),
            stripe_session_id: sessionId,
          }).eq("user_id", user.id);

          logStep("Plan granted", { plan: planInfo.plan, months: planInfo.months, expires: expiresAt.toISOString() });

          return new Response(JSON.stringify({
            subscribed: true,
            plan: planInfo.plan,
            subscription_end: isSubscription ? null : expiresAt.toISOString(),
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Otherwise check existing subscription status
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    // Also check DB for one-time payment plans
    const { data: planData } = await supabaseAdmin
      .from("user_plans")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .single();

    // Check active Stripe subscription first
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const priceId = subscription.items.data[0].price.id;
        const planInfo = PRICE_MAP[priceId];
        const plan = planInfo?.plan || "estudiante";
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

        await supabaseAdmin.from("user_plans").update({ plan }).eq("user_id", user.id);

        return new Response(JSON.stringify({
          subscribed: true,
          plan,
          subscription_end: subscriptionEnd,
          is_recurring: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check one-time payment plan from DB
    if (planData && planData.plan !== "gratis" && planData.expires_at) {
      const expiresAt = new Date(planData.expires_at);
      if (expiresAt > new Date()) {
        return new Response(JSON.stringify({
          subscribed: true,
          plan: planData.plan,
          subscription_end: planData.expires_at,
          is_recurring: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No active plan - reset to gratis
    await supabaseAdmin.from("user_plans").update({ plan: "gratis", expires_at: null }).eq("user_id", user.id);

    return new Response(JSON.stringify({ subscribed: false, plan: "gratis" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
