"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { AlertCircle, Ticket, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { ProtectedRoute } from "@/components/auth/AuthGuards";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get("clientSecret");
  const bookingId = searchParams.get("bookingId");

  const [verifying, setVerifying] = useState(Boolean(clientSecret && bookingId));
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Validate the booking session
  useEffect(() => {
    if (!clientSecret || !bookingId) {
      setSessionError("Invalid checkout session. Missing payment credentials.");
      setVerifying(false);
      return;
    }

    const checkBookingStatus = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        const booking = data.data;

        if (booking.status === "confirmed" || booking.status === "completed") {
          toast.success("This booking is already paid and confirmed!");
          router.replace(`/checkout/success?bookingId=${encodeURIComponent(bookingId)}`);
          return;
        }

        if (booking.status === "cancelled") {
          setSessionError("This booking was cancelled and is no longer payable.");
          setVerifying(false);
          return;
        }

        setVerifying(false);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setSessionError(error.response?.data?.message || "Could not verify booking session.");
        setVerifying(false);
      }
    };

    checkBookingStatus();
  }, [clientSecret, bookingId, router]);

  // Loading / verification state
  if (verifying) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-yellow-400" />
        <p className="text-sm font-semibold text-slate-300">
          Securing your checkout session...
        </p>
      </div>
    );
  }

  // Session error or invalid credentials
  if (sessionError || !clientSecret || !bookingId) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a1628]/85 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 shadow-[0_8px_30px_rgba(255,215,0,0.15)]">
            <AlertCircle size={32} />
          </div>

          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Invalid Checkout Session
          </h1>

          <p className="mx-auto mt-2.5 text-sm leading-relaxed text-slate-400">
            {sessionError || "The payment session is invalid or has expired. Please return to your bookings to retry."}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/bookings"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_20px_rgba(250,204,21,0.22)] transition hover:brightness-105"
            >
              <Ticket size={16} />
              My Bookings
            </Link>

            <Link
              href="/services"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-yellow-400/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Sparkles size={16} className="text-yellow-400" />
              Explore Services
            </Link>
          </div>
        </div>
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
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
            <p className="mt-3 text-xs text-slate-500">Loading checkout...</p>
          </div>
        }
      >
        <CheckoutPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
