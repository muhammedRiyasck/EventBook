import { BookingStatus, PaymentStatus } from "@/types";

export const getBookingStatusBadgeClass = (status: BookingStatus | string): string => {
  switch (status) {
    case "confirmed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";
    case "pending":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-400";
    case "completed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-400";
    case "cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-400";
    default:
      return "border-white/10 bg-white/[0.05] text-slate-400";
  }
};

export const getBookingStatusDotClass = (status: BookingStatus | string): string => {
  switch (status) {
    case "confirmed":
      return "bg-emerald-400";
    case "pending":
      return "bg-yellow-400";
    case "completed":
      return "bg-blue-400";
    case "cancelled":
      return "bg-red-400";
    default:
      return "bg-slate-400";
  }
};

export const getPaymentStatusBadgeClass = (status: PaymentStatus | string): string => {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "partially_refunded":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "refunded":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    case "unpaid":
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }
};
