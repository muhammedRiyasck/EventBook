"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  Ticket,
  ArrowRight,
  Mail,
  CalendarDays,
  ShieldCheck,
  Copy,
  Check,
  LayoutDashboard,
  Loader2,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/AuthGuards";

interface BookingData {
  _id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalPrice: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  selectedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  service?: {
    _id: string;
    title: string;
    category?: string;
    location?: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

        // Strictly verify that the booking is confirmed or completed
        if (
          fetchedBooking.status !== "confirmed" &&
          fetchedBooking.status !== "completed"
        ) {
          if (fetchedBooking.status === "cancelled") {
            toast.error("This booking has been cancelled.");
          } else {
            toast.error("Payment has not been completed for this booking.");
          }
          router.replace("/bookings");
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

  const handleCopyId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050d1e] px-4 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Verifying Payment Confirmation
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Validating your booking status securely with our servers...
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = booking.startDate
    ? new Date(booking.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white">
      {/* Background glow effects aligned with the EventBook theme */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-yellow-400/[0.08] blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/[0.09] blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/[0.12] blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a1628]/85 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-10">
          {/* Header celebration badge */}
          <div className="text-center">
            {/* Multi-ring glowing celebration badge */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-yellow-400/20 duration-1000" />
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-yellow-400/30 via-emerald-400/20 to-amber-500/30 blur-md" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] via-[#f59e0b] to-[#d97706] shadow-[0_10px_35px_rgba(250,204,21,0.4)]">
                <CheckCircle2 size={40} className="text-[#071126]" strokeWidth={2.5} />
              </div>
            </div>

            {/* Pill Badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#ffd700]">
              <Sparkles size={13} className="text-[#ffd700]" />
              Payment Successful
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Booking Confirmed!
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              Thank you for choosing EventBook. Your payment has been received and your booking is confirmed with the vendor.
            </p>
          </div>

          {/* Reference & Transaction Summary */}
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4.5 sm:p-5">
            <div className="flex flex-col gap-3.5 divide-y divide-white/[0.06] sm:gap-4">
              {/* Reference ID */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Booking Reference
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-yellow-400 sm:text-sm">
                    #{booking._id.slice(-8).toUpperCase()}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-400 transition hover:border-yellow-400/30 hover:text-white cursor-pointer"
                    title="Copy full booking ID"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>

              {/* Service Name */}
              {booking.service?.title && (
                <div className="flex items-center justify-between pt-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Service
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Tag size={13} className="text-yellow-400" />
                    {booking.service.title}
                  </span>
                </div>
              )}

              {/* Amount Paid */}
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Amount Paid
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
                  ₹{booking.totalPrice?.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Scheduled Date / Slot */}
              {formattedDate && (
                <div className="flex items-center justify-between pt-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Schedule
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {formattedDate}
                    {booking.selectedSlot
                      ? ` (${booking.selectedSlot.startTime} - ${booking.selectedSlot.endTime})`
                      : booking.startTime && booking.endTime
                      ? ` (${booking.startTime} - ${booking.endTime})`
                      : ""}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Payment Status
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Verified &amp; Paid
                </span>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Processed Via
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <ShieldCheck size={14} className="text-yellow-400" />
                  Stripe Encrypted Checkout
                </span>
              </div>
            </div>
          </div>

          {/* What happens next? */}
          <div className="mt-8">
            <h2 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              What Happens Next?
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                  <Mail size={16} />
                </div>
                <h3 className="text-xs font-bold text-white">Email Receipt</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  A receipt &amp; event schedule have been sent to your email.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                  <CalendarDays size={16} />
                </div>
                <h3 className="text-xs font-bold text-white">Live Status</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Track confirmation and cancellation policies in My Bookings.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-xs font-bold text-white">Event Ready</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  The vendor has reserved your designated dates and slots.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/bookings"
              id="success-view-bookings-btn"
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_6px_25px_rgba(250,204,21,0.25)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_8px_30px_rgba(250,204,21,0.38)] active:scale-[0.98]"
            >
              <Ticket size={17} />
              View My Bookings
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/services"
              id="success-explore-services-btn"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-yellow-400/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Sparkles size={16} className="text-yellow-400" />
              Explore More Services
            </Link>
          </div>

          {/* Return to Dashboard */}
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

export default function CheckoutSuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#050d1e] text-white">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
              Loading booking confirmation...
            </div>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </ProtectedRoute>
  );
}
