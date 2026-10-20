import React from "react";
import { MapPin, IndianRupee, User, CheckCircle2, XCircle } from "lucide-react";
import { Booking, Service, User as UserType } from "@/types";
import { formatDate } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusAction } from "@/hooks/useAdminBookings";

interface BookingCardProps {
  booking: Booking;
  updatingId: string | null;
  onStatusAction: (booking: Booking, status: StatusAction) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  updatingId,
  onStatusAction,
}) => {
  const user = booking.user as UserType;
  const svc = booking.service as Service;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
        <span className="font-mono text-xs text-slate-400">
          #{booking._id.slice(-6).toUpperCase()}
        </span>

        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-4 p-4">
        {/* Customer */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Customer
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-300">
              <User size={17} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {typeof user === "object" ? user.name : "User"}
              </p>
              <p className="break-all text-xs text-slate-500">
                {typeof user === "object" ? user.email : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Service */}
        <div className="border-t border-white/[0.06] pt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Service
          </p>

          <p className="text-sm font-semibold text-white">
            {svc && typeof svc === "object" ? svc.title : "Service"}
          </p>

          {svc && typeof svc === "object" && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={12} />
              {svc.location?.city}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Start date
            </p>
            <p className="text-xs text-slate-200">
              {formatDate(booking.startDate)}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              End date
            </p>
            <p className="text-xs text-slate-200">
              {formatDate(booking.endDate)}
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div>
            <p className="text-xs text-slate-500">Total amount</p>
            {booking.refundAmount && booking.refundAmount > 0 ? (
              <p className="text-[11px] font-semibold text-cyan-400">
                Refunded: ₹{new Intl.NumberFormat("en-IN").format(booking.refundAmount)}
              </p>
            ) : null}
          </div>

          <p className="flex items-center gap-0.5 text-base font-extrabold text-yellow-400">
            <IndianRupee size={14} />
            {new Intl.NumberFormat("en-IN").format(booking.totalPrice)}
          </p>
        </div>

        {/* Mobile actions */}
        {(booking.status === "confirmed" || booking.status === "pending") && (
          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            {booking.status === "confirmed" && (
              <button
                type="button"
                onClick={() => onStatusAction(booking, "completed")}
                disabled={updatingId === booking._id}
                className="inline-flex cursor-pointer h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.14] disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Complete
              </button>
            )}

            <button
              type="button"
              onClick={() => onStatusAction(booking, "cancelled")}
              disabled={updatingId === booking._id}
              className="inline-flex cursor-pointer h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.14] disabled:opacity-50"
            >
              <XCircle size={14} />
              Cancel
            </button>
          </div>
        )}

        {(booking.status === "cancelled" || booking.status === "completed") && (
          <p className="border-t border-white/[0.06] pt-3 text-center text-xs text-slate-500">
            This booking has a final status.
          </p>
        )}
      </div>
    </article>
  );
};

export default BookingCard;
