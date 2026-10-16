"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Loader2,
  Tag,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/AuthGuards";

interface BookingData {
  _id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount: number;
  startDate?: string;
  endDate?: string;
  service?: {
    _id: string;
    title: string;
    category?: string;
    location?: string;
  };
}

function CancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      router.replace("/bookings");
      return;
    }

    let isMounted = true;
    const verifyBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        const fetchedBooking: BookingData = data?.data;

        if (!isMounted) return;

        if (!fetchedBooking) {
          toast.error("Booking reference not found.");
          router.replace("/bookings");
          return;
        }

        // If booking is already confirmed, redirect to success
        if (
          fetchedBooking.status === "confirmed" ||
          fetchedBooking.status === "completed"
        ) {
          toast.success("This booking is already paid and confirmed!");
          router.replace(
            `/checkout/success?bookingId=${encodeURIComponent(bookingId)}`
          );
          return;
        }

        setBooking(fetchedBooking);
      } catch (err: unknown) {
        if (!isMounted) return;
        const error = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const message =
          error.response?.data?.message ||
          "Invalid booking reference or access denied.";
        toast.error(message);
        router.replace("/bookings");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId, router]);

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050d1e] px-4 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <Loader2 className="h-8 w-8 animate-spin text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Checking Booking Session
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Validating your payment session status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-red-500/[0.06] blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a1628]/85 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-10">
          {/* Warning icon container */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-400 shadow-[0_10px_35px_rgba(239,68,68,0.2)]">
            <AlertCircle size={38} strokeWidth={2.2} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
            Payment Not Completed
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Checkout Cancelled
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            Your payment session was cancelled. No charges were made to your account, and your booking remains on hold.
          </p>

          {/* Session Details */}
          <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left sm:p-5">
            <div className="flex flex-col gap-3 divide-y divide-white/[0.06]">
              {/* Reference */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Booking Reference
                </span>
                <span className="font-mono text-xs font-bold text-yellow-400 sm:text-sm">
                  #{booking._id.slice(-8).toUpperCase()}
                </span>
              </div>

              {/* Service */}
              {booking.service?.title && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Service
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Tag size={13} className="text-yellow-400" />
                    {booking.service.title}
                  </span>
                </div>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pending Amount
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-200">
                  <DollarSign size={14} className="text-yellow-400" />
                  ₹{booking.totalAmount?.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold capitalize text-amber-400">
                  {booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/bookings"
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_6px_25px_rgba(250,204,21,0.25)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_8px_30px_rgba(250,204,21,0.38)] active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Manage in My Bookings
            </Link>

            <Link
              href="/services"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-yellow-400/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Sparkles size={16} className="text-yellow-400" />
              Browse Services
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-yellow-400"
            >
              <LayoutDashboard size={13} />
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#050d1e] text-white">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              Loading checkout status...
            </div>
          </div>
        }
      >
        <CancelContent />
      </Suspense>
    </ProtectedRoute>
  );
}
