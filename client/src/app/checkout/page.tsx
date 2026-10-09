"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/checkout/CheckoutForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("clientSecret");
  const bookingId = searchParams.get("bookingId");

  if (!clientSecret || !bookingId) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-slate-400">Invalid checkout session. Please try booking again.</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "night" as const,
      variables: {
        colorPrimary: "#EAB308",
        colorBackground: "#0d1a2e",
        colorText: "#e2e8f0",
        colorDanger: "#f87171",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "12px",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.04)",
          boxShadow: "none",
          padding: "12px 16px",
        },
        ".Input:focus": {
          border: "1px solid rgba(234,179,8,0.5)",
          boxShadow: "0 0 0 2px rgba(234,179,8,0.1)",
          outline: "none",
        },
        ".Label": {
          color: "#94a3b8",
          fontSize: "13px",
          fontWeight: "500",
          marginBottom: "6px",
        },
        ".Tab": {
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.04)",
        },
        ".Tab:hover": {
          border: "1px solid rgba(234,179,8,0.4)",
        },
        ".Tab--selected": {
          border: "1px solid rgba(234,179,8,0.6)",
          backgroundColor: "rgba(234,179,8,0.08)",
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm bookingId={bookingId} />
    </Elements>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
