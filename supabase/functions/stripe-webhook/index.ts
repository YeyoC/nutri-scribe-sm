import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TAJYwE2E9LRIgi6Kr6MMa5E": "estudiante",
  "price_1TAPrFE2E9LRIgi6j3qXxyy9": "estudiante",
  "price_1TAPrbE2E9LRIgi6gsunWAGx": "estudiante",
  "price_1TAPsjE2E9LRIgi68yByTA8I": "estudiante",
  "price_1TAJa8E2E9LRIgi6GdkENTYr": "profesional",
  "price_1TAm7XE2E9LRIgi6PLTTkn8A": "profesional",
  "price_1TAm7xE2E9LRIgi6PCcITJKf": "profesional",
  "price_1TAmBtE2E9LRIgi6sGKaMMUV": "profesional",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) throw new Error("Stripe env vars missing");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { err });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    logStep("Received event", { type: event.type });

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const priceId = invoice.lines.data[0]?.price?.id;
        const plan = priceId ? PRICE_TO_PLAN[priceId] : null;
        if (!plan) break;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === customer.email);
        if (!user) break;

        await supabaseAdmin.from("user_plans").update({ plan, expires_at: null }).eq("user_id", user.id);
        logStep("Plan renewed", { plan, email: customer.email });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === customer.email);
        if (!user) break;

        await supabaseAdmin.from("user_plans").update({ plan: "gratis", expires_at: null }).eq("user_id", user.id);
        logStep("Subscription cancelled — downgraded to gratis", { email: customer.email });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status !== "active") break;

        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? PRICE_TO_PLAN[priceId] : null;
        if (!plan) break;

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === customer.email);
        if (!user) break;

        await supabaseAdmin.from("user_plans").update({ plan }).eq("user_id", user.id);
        logStep("Subscription updated", { plan, email: customer.email });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
