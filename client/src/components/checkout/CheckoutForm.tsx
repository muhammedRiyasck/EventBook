"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck, Lock, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface Props {
  bookingId: string;
}

export default function CheckoutForm({ bookingId }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg(null);

    // Submit the payment element to collect card details
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMsg(submitError.message || "Card details incomplete");
      setProcessing(false);
      return;
    }

    // Confirm payment using the PaymentElement
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message || "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Notify backend to confirm the booking
      try {
        await api.post(`/bookings/${bookingId}/confirm-payment`, {
          paymentIntentId: paymentIntent.id,
        });
      } catch {
        // Even if this fails, Stripe webhook will handle it
        console.warn("Could not notify server, webhook will handle confirmation.");
      }

      toast.success("🎉 Payment successful! Booking confirmed.");
      router.push("/checkout/success");
    }
  };

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10">
            <CreditCard className="h-7 w-7 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Complete Payment
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your card details are encrypted and secured by Stripe.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Stripe PaymentElement */}
            <PaymentElement
              options={{
                layout: "accordion",
                fields: {
                  billingDetails: {
                    name: "auto",
                    email: "auto",
                  },
                },
              }}
            />

            {/* Error message */}
            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </div>
            )}


            {/* Submit button */}
            <button
              type="submit"
              disabled={!stripe || !elements || processing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 font-bold text-slate-900 transition-all hover:bg-yellow-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-slate-600">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="h-4 w-4" />
            256-bit SSL
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Lock className="h-4 w-4" />
            Powered by Stripe
          </div>
        </div>
      </div>
    </div>
  );
}
