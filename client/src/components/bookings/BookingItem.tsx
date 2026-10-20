import React from "react";
import {
  CalendarDays,
  MapPin,
  IndianRupee,
  X,
  Clock,
  Users,
  CreditCard,
} from "lucide-react";
import { Booking, Service } from "@/types";
import { formatDate } from "@/utils/formatters";

interface BookingItemProps {
  booking: Booking;
  retrying: string | null;
  cancellingBooking: Booking | null;
  isCancelling: boolean;
  onRetryPayment: (id: string) => void;
  onCancelBooking: (booking: Booking) => void;
}

export const BookingItem: React.FC<BookingItemProps> = ({
  booking,
  retrying,
  cancellingBooking,
  isCancelling,
  onRetryPayment,
  onCancelBooking,
}) => {
  const svc = booking.service as Service | undefined;

  const isActive = booking.status === "confirmed" || booking.status === "pending";
  const isPast = new Date(booking.endDate) < new Date();
  const canCancel = isActive && new Date(booking.startDate) > new Date();
  const canRetry =
    booking.status === "pending" &&
    booking.paymentStatus === "unpaid" &&
    !isPast;

  return (
    <div
      id={`booking-${booking._id}`}
      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition-all duration-300 hover:border-yellow-400/20 hover:bg-white/[0.045] sm:p-6"
    >
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            {/* Service icon */}
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-yellow-400 sm:flex">
              <CalendarDays size={19} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-white sm:text-lg">
                {svc && typeof svc === "object" ? svc.title : "Service"}
              </h3>

              {svc && typeof svc === "object" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">
                    {svc.location?.city
                      ? `${svc.location.city}, ${svc.location?.state}`
                      : "Service Location"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
            booking.status === "confirmed"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
              : booking.status === "pending"
                ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                : booking.status === "completed"
                  ? "border-blue-400/20 bg-blue-400/10 text-blue-400"
                  : booking.status === "cancelled"
                    ? "border-red-400/20 bg-red-400/10 text-red-400"
                    : "border-white/10 bg-white/[0.05] text-slate-400"
          }`}
        >
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
              booking.status === "confirmed"
                ? "bg-emerald-400"
                : booking.status === "pending"
                  ? "bg-yellow-400"
                  : booking.status === "completed"
                    ? "bg-blue-400"
                    : booking.status === "cancelled"
                      ? "bg-red-400"
                      : "bg-slate-400"
            }`}
          />
          {booking.status}
        </span>
      </div>

      {/* Booking Details */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Dates */}
        <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <CalendarDays size={13} />
            Booking Dates
          </div>

          <p className="text-sm font-medium text-slate-300">
            {formatDate(booking.startDate)}
            <span className="mx-2 text-slate-600">→</span>
            {formatDate(booking.endDate)}
          </p>
        </div>

        {/* Duration / Time Slot */}
        {booking.startTime && booking.endTime ? (
          <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <Clock size={13} />
              Time Slot
            </div>
            <p className="text-sm font-medium text-slate-300">
              {booking.startTime} – {booking.endTime}
              {booking.totalHours && (
                <span className="ml-2 text-xs text-slate-500">
                  ({booking.totalHours.toFixed(1)} hrs)
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Duration
            </div>
            <p className="text-sm font-medium text-slate-300">
              {booking.totalDays} day{booking.totalDays > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Guest Count */}
        {booking.guestCount && (
          <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <Users size={13} />
              Guests
            </div>
            <p className="text-sm font-medium text-slate-300">
              {booking.guestCount} guest{booking.guestCount > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Payment Status */}
        <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <CreditCard size={13} />
            Payment
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
              booking.paymentStatus === "paid"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                : booking.paymentStatus === "refunded"
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-400"
                  : booking.paymentStatus === "partially_refunded"
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-400"
                    : "border-orange-400/20 bg-orange-400/10 text-orange-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                booking.paymentStatus === "paid"
                  ? "bg-emerald-400"
                  : booking.paymentStatus === "refunded"
                    ? "bg-cyan-400"
                    : booking.paymentStatus === "partially_refunded"
                      ? "bg-amber-400"
                      : "bg-orange-400"
              }`}
            />
            {booking.paymentStatus === "paid"
              ? "Paid"
              : booking.paymentStatus === "refunded"
                ? "Refunded"
                : booking.paymentStatus === "partially_refunded"
                  ? "Partially Refunded"
                  : "Payment Pending"}
          </span>
        </div>
      </div>

      {/* Refund Details */}
      {((booking.refundAmount && booking.refundAmount > 0) ||
        booking.paymentStatus === "refunded" ||
        booking.paymentStatus === "partially_refunded") && (
        <div className="mt-3 overflow-hidden rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-400">
                <IndianRupee size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Refund Details
                  </span>
                  <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-400">
                    {booking.paymentStatus === "refunded"
                      ? "100% Full Refund"
                      : "Partial Refund"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {booking.refundedAt
                    ? `Processed on ${formatDate(booking.refundedAt)}`
                    : "Processed to original payment method"}
                  {booking.refundStatus && booking.refundStatus !== "none" && (
                    <span className="ml-1.5 capitalize text-slate-400">
                      · Status:{" "}
                      <span className="font-medium text-slate-300">
                        {booking.refundStatus}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {booking.refundAmount ? (
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Amount Refunded
                </p>
                <p className="text-lg font-black text-cyan-400">
                  ₹{new Intl.NumberFormat("en-IN").format(booking.refundAmount)}
                </p>
              </div>
            ) : null}
          </div>

          {booking.refundReason && (
            <p className="mt-2.5 border-t border-cyan-400/10 pt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Note:</span>{" "}
              {booking.refundReason}
            </p>
          )}
        </div>
      )}

      {/* Special Request Notes */}
      {booking.notes && (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Special Request
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">
            {booking.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Price */}
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Total Amount
          </p>

          <div className="flex items-center gap-0.5 text-xl font-black text-yellow-400">
            <IndianRupee size={16} strokeWidth={2.5} />
            <span>{new Intl.NumberFormat("en-IN").format(booking.totalPrice)}</span>
          </div>

          {booking.refundAmount && booking.refundAmount > 0 ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-cyan-400">
              <span>Refunded:</span>
              <span>
                ₹{new Intl.NumberFormat("en-IN").format(booking.refundAmount)}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Retry payment */}
          {canRetry && (
            <button
              id={`retry-payment-${booking._id}`}
              onClick={() => onRetryPayment(booking._id)}
              disabled={retrying === booking._id}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {retrying === booking._id ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  Preparing payment...
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  Retry Payment
                </>
              )}
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              id={`cancel-booking-${booking._id}`}
              onClick={() => onCancelBooking(booking)}
              disabled={cancellingBooking?._id === booking._id && isCancelling}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-400/25 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <X size={15} />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingItem;
