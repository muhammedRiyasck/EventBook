import React from "react";
import {
  X,
  User,
  Layers,
  ShieldCheck,
  Receipt,
  ArrowUpRight,
  Printer,
  RotateCcw,
} from "lucide-react";
import { PopulatedBooking } from "./types";
import { StripeTransactionDetails } from "@/types";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { getPaymentStatusBadge, getBookingStatusBadge } from "./badges";

interface TransactionDetailModalProps {
  show: boolean;
  selectedTx: PopulatedBooking | null;
  stripeDetails: StripeTransactionDetails | null;
  loadingDetail: boolean;
  onClose: () => void;
  onOpenReceipt: () => void;
  onOpenRefund: (tx: PopulatedBooking) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  show,
  selectedTx,
  stripeDetails,
  loadingDetail,
  onClose,
  onOpenReceipt,
  onOpenRefund,
}) => {
  if (!show || !selectedTx) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#09152b] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 cursor-pointer right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            Transaction Breakdown
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400 font-mono">
            #{selectedTx._id}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white mb-4">
          Booking #{selectedTx._id.slice(-6).toUpperCase()}
        </h2>

        {loadingDetail ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-6 h-6 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-2" />
            Fetching gateway charge details...
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div>
                <span className="text-slate-400 text-[11px] block mb-1">
                  Payment Status:
                </span>
                {getPaymentStatusBadge(selectedTx.paymentStatus)}
              </div>
              <div className="ml-6">
                <span className="text-slate-400 text-[11px] block mb-1">
                  Booking Status:
                </span>
                {getBookingStatusBadge(selectedTx.status)}
              </div>
              {selectedTx.refundStatus && selectedTx.refundStatus !== "none" && (
                <div className="ml-6">
                  <span className="text-slate-400 text-[11px] block mb-1">
                    Refund Status:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {selectedTx.refundStatus.toUpperCase()} (
                    {formatCurrency(selectedTx.refundAmount)})
                  </span>
                </div>
              )}
            </div>

            {/* Customer & Service Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                  <User size={14} /> Customer Information
                </h3>
                <div>
                  <span className="text-slate-400 text-[11px]">Name:</span>{" "}
                  <span className="text-white font-medium">
                    {selectedTx.user?.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Email:</span>{" "}
                  <span className="text-white">
                    {selectedTx.user?.email || "N/A"}
                  </span>
                </div>
                {selectedTx.user?.phone && (
                  <div>
                    <span className="text-slate-400 text-[11px]">Phone:</span>{" "}
                    <span className="text-white">{selectedTx.user.phone}</span>
                  </div>
                )}
              </div>

              {/* Service Info */}
              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                  <Layers size={14} /> Service Details
                </h3>
                <div>
                  <span className="text-slate-400 text-[11px]">Title:</span>{" "}
                  <span className="text-white font-medium">
                    {selectedTx.service?.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Schedule:</span>{" "}
                  <span className="text-white">
                    {formatDate(selectedTx.startDate)} — {formatDate(selectedTx.endDate)}
                  </span>
                </div>
                {selectedTx.startTime && (
                  <div>
                    <span className="text-slate-400 text-[11px]">Slot:</span>{" "}
                    <span className="text-white">
                      {selectedTx.startTime} - {selectedTx.endTime}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gateway Payment Details */}
            <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                <ShieldCheck size={14} /> Gateway & Stripe Details
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Payment Intent ID:
                  </span>
                  <span
                    className="font-mono text-white text-[11px] truncate block"
                    title={selectedTx.stripePaymentIntentId}
                  >
                    {selectedTx.stripePaymentIntentId || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Payment Method:
                  </span>
                  <span className="text-white capitalize">
                    {stripeDetails?.brand
                      ? `${stripeDetails.brand} (•••• ${stripeDetails.last4})`
                      : "Credit / Debit Card"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Settled Amount:
                  </span>
                  <span className="text-white font-bold">
                    {formatCurrency(selectedTx.totalPrice)}
                  </span>
                </div>
              </div>

              {stripeDetails?.receiptUrl && (
                <div className="pt-2">
                  <a
                    href={stripeDetails.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-yellow-400 hover:underline text-xs"
                  >
                    <Receipt size={14} /> View Official Stripe Gateway Hosted Receipt{" "}
                    <ArrowUpRight size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onOpenReceipt}
                className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium transition-colors"
              >
                <Printer size={14} /> Generate Printable Invoice
              </button>
              {selectedTx.paymentStatus === "paid" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRefund(selectedTx);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium border border-rose-500/20 transition-colors"
                >
                  <RotateCcw size={14} /> Issue Refund
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailModal;
