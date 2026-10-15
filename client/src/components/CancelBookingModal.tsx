"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  AlertTriangle,
  IndianRupee,
  Shield,
  CalendarDays,
  Clock,
} from "lucide-react";
import { Booking, Service } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CancelBookingModalProps {
  booking: Booking;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

// ── Policy config ──────────────────────────────────────────────────────────────

const POLICY_CONFIG = {
  Flexible: {
    label: "Flexible",
    color: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/10",
    refundFraction: (_days: number) => 1,
    description: "Full refund · No questions asked",
  },
  Moderate: {
    label: "Moderate",
    color: "text-yellow-400",
    border: "border-yellow-400/20",
    bg: "bg-yellow-400/10",
    refundFraction: (days: number) => (days > 7 ? 1 : 0.5),
    description: "Full refund if > 7 days · 50% within 7 days",
  },
  Strict: {
    label: "Strict",
    color: "text-red-400",
    border: "border-red-400/20",
    bg: "bg-red-400/10",
    refundFraction: (_days: number) => 0,
    description: "Non-refundable after booking confirmation",
  },
} as const;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(n));

// ── Component ──────────────────────────────────────────────────────────────────

export default function CancelBookingModal({
  booking,
  onConfirm,
  onClose,
  isLoading = false,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const svc = booking.service as Service;
  const isPaid = booking.paymentStatus === "paid";

  // Compute refund preview
  const policy = svc?.cancellationPolicy;
  const cfg = policy ? POLICY_CONFIG[policy] : null;
  const daysToEvent = Math.ceil(
    (new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const refundFraction = cfg ? cfg.refundFraction(daysToEvent) : 0;
  const refundAmount = isPaid ? Math.round(booking.totalPrice * refundFraction) : 0;
  const hasRefund = isPaid && refundAmount > 0;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLoading, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isLoading) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5,13,30,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1d38 100%)" }}
      >
        {/* Glow accents */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-500/[0.05] blur-[60px]" />

        {/* ── Header ── */}
        <div className="relative flex items-start justify-between border-b border-white/[0.08] p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cancel Booking</h2>
              <p className="mt-0.5 text-xs text-slate-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            id="cancel-modal-close"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition hover:border-white/20 hover:text-white disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="relative space-y-4 p-6">

          {/* Service summary card */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Booking</p>
            <p className="text-sm font-semibold text-white">
              {typeof svc === "object" ? svc.title : "Service"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                {fmtDate(booking.startDate)}
                {booking.startDate !== booking.endDate && <> → {fmtDate(booking.endDate)}</>}
              </span>
              {booking.startTime && booking.endTime && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {booking.startTime} – {booking.endTime}
                </span>
              )}
            </div>
          </div>

          {/* Refund preview — paid bookings only */}
          {isPaid && (
            <div
              className={`rounded-xl border p-4 ${
                hasRefund
                  ? cfg ? `${cfg.border} ${cfg.bg}` : "border-emerald-400/20 bg-emerald-400/10"
                  : "border-red-400/20 bg-red-400/10"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Shield
                  size={13}
                  className={hasRefund ? cfg?.color || "text-emerald-400" : "text-red-400"}
                />
                <span className={`text-xs font-semibold ${hasRefund ? cfg?.color || "text-emerald-400" : "text-red-400"}`}>
                  {cfg?.label ?? "No policy"} cancellation policy
                </span>
              </div>

              <p className="text-xs text-slate-400">{cfg?.description ?? "No refund available."}</p>

              <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                <p className="text-xs text-slate-500">
                  Paid:&nbsp;
                  <span className="font-semibold text-slate-300">₹{fmtCurrency(booking.totalPrice)}</span>
                </p>
                <div className={`flex items-center gap-0.5 font-bold ${hasRefund ? cfg?.color || "text-emerald-400" : "text-red-400"}`}>
                  <span className="text-xs text-slate-500 mr-1">Refund:</span>
                  {hasRefund ? (
                    <>
                      <IndianRupee size={11} strokeWidth={2.5} />
                      <span className="text-sm">{fmtCurrency(refundAmount)}</span>
                    </>
                  ) : (
                    <span className="text-sm">None</span>
                  )}
                </div>
              </div>

              {policy === "Moderate" && (
                <p className="mt-2 text-[11px] text-slate-600">
                  Event is&nbsp;
                  <span className="font-semibold text-slate-400">
                    {daysToEvent > 0
                      ? `${daysToEvent} day${daysToEvent !== 1 ? "s" : ""} away`
                      : "today or past"}
                  </span>
                  &nbsp;→ {refundFraction === 1 ? "full refund applies" : "50% refund applies"}
                </p>
              )}
            </div>
          )}

          {/* No payment notice */}
          {!isPaid && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <p className="text-xs text-slate-500">No payment was made — nothing to refund.</p>
            </div>
          )}

          {/* Optional reason textarea */}
          <div>
            <label
              htmlFor="cancel-reason"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Reason&nbsp;<span className="font-normal normal-case text-slate-600">(optional)</span>
            </label>
            <textarea
              id="cancel-reason"
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={isLoading}
              placeholder="Let us know why you're cancelling…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 disabled:opacity-50"
            />
            <p className="mt-1 text-right text-[11px] text-slate-700">{reason.length}/500</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 border-t border-white/[0.07] px-6 pb-6 pt-4">
          <button
            id="cancel-modal-keep"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-40"
          >
            Keep Booking
          </button>

          <button
            id="cancel-modal-confirm"
            onClick={() => onConfirm(reason.trim())}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/10 py-2.5 text-sm font-bold text-red-400 transition hover:border-red-400/30 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                Cancelling…
              </>
            ) : (
              <>
                <X size={14} />
                {hasRefund
                  ? `Cancel & Refund ₹${fmtCurrency(refundAmount)}`
                  : "Yes, Cancel Booking"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
