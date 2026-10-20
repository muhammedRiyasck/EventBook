import React, { useId } from "react";
import { X, AlertCircle } from "lucide-react";
import { PopulatedBooking } from "./types";
import { formatCurrency } from "@/utils/formatters";

interface RefundModalProps {
  refundTarget: PopulatedBooking | null;
  refundType: "full" | "partial";
  onRefundTypeChange: (type: "full" | "partial") => void;
  refundAmount: string;
  onRefundAmountChange: (val: string) => void;
  refundReason: string;
  onRefundReasonChange: (val: string) => void;
  customReason: string;
  onCustomReasonChange: (val: string) => void;
  isRefunding: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  refundTarget,
  refundType,
  onRefundTypeChange,
  refundAmount,
  onRefundAmountChange,
  refundReason,
  onRefundReasonChange,
  customReason,
  onCustomReasonChange,
  isRefunding,
  onClose,
  onSubmit,
}) => {
  const refundAmountInputId = useId();
  const refundReasonSelectId = useId();
  const customReasonInputId = useId();

  if (!refundTarget) return null;

  const remaining = Math.max(
    0,
    refundTarget.totalPrice - (refundTarget.refundAmount || 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/20 bg-[#09152b] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 cursor-pointer right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Payment Gateway Action
          </span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Issue Online Refund
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          The refund will be directly processed via Stripe and returned to
          the customer&apos;s original payment method.
        </p>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Booking summary box */}
          <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="text-white font-medium">
                {refundTarget.user?.name} ({refundTarget.user?.email})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service:</span>
              <span className="text-white font-medium">
                {refundTarget.service?.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Paid:</span>
              <span className="text-white font-bold">
                {formatCurrency(refundTarget.totalPrice)}
              </span>
            </div>
            {refundTarget.refundAmount ? (
              <div className="flex justify-between text-rose-400">
                <span>Already Refunded:</span>
                <span>{formatCurrency(refundTarget.refundAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-white/[0.06] pt-1.5 font-semibold">
              <span className="text-slate-300">Remaining Balance:</span>
              <span className="text-emerald-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Refund Type Selector */}
          <div>
            <label className="text-slate-300 font-semibold mb-2 block">
              Refund Mode:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onRefundTypeChange("full");
                  onRefundAmountChange(String(remaining));
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  refundType === "full"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                }`}
              >
                Full Refund
                <span className="block cursor-pointer text-[11px] font-normal text-slate-400 mt-0.5">
                  {formatCurrency(remaining)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onRefundTypeChange("partial")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  refundType === "partial"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                }`}
              >
                Partial Refund
                <span className="block cursor-pointer text-[11px] font-normal text-slate-400 mt-0.5">
                  Specify custom amount
                </span>
              </button>
            </div>
          </div>

          {/* Partial Amount Input */}
          {refundType === "partial" && (
            <div>
              <label
                htmlFor={refundAmountInputId}
                className="text-slate-300 font-semibold mb-1 block"
              >
                Partial Refund Amount (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  id={refundAmountInputId}
                  type="number"
                  step="0.01"
                  min="1"
                  max={remaining}
                  value={refundAmount}
                  onChange={(e) => onRefundAmountChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] pl-8 pr-4 text-xs text-white outline-none focus:border-rose-400/40"
                  placeholder="Enter amount to refund..."
                  required
                />
              </div>
            </div>
          )}

          {/* Reason Dropdown */}
          <div>
            <label
              htmlFor={refundReasonSelectId}
              className="text-slate-300 font-semibold mb-1 block"
            >
              Reason for Refund:
            </label>
            <select
              id={refundReasonSelectId}
              value={refundReason}
              onChange={(e) => onRefundReasonChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none"
            >
              <option value="Customer requested cancellation">
                Customer requested cancellation
              </option>
              <option value="Service unavailable or rescheduling conflict">
                Service unavailable or rescheduling conflict
              </option>
              <option value="Billing dispute or accidental duplicate">
                Billing dispute or accidental duplicate
              </option>
              <option value="Mutual agreement / satisfaction guarantee">
                Mutual agreement / satisfaction guarantee
              </option>
              <option value="Other">Other (Custom reason)</option>
            </select>
          </div>

          {refundReason === "Other" && (
            <div>
              <label
                htmlFor={customReasonInputId}
                className="text-slate-300 font-semibold mb-1 block"
              >
                Custom Reason Notes:
              </label>
              <textarea
                id={customReasonInputId}
                value={customReason}
                onChange={(e) => onCustomReasonChange(e.target.value)}
                placeholder="Explain the reason for issuing this refund..."
                rows={2}
                className="w-full rounded-xl border border-white/[0.09] bg-[#0a1628] p-3 text-xs text-white outline-none focus:border-rose-400/40"
                required
              />
            </div>
          )}

          {/* Notice banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              The customer will automatically receive a detailed refund confirmation email
              with invoice reference and expected arrival timeline (5-10 business days).
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 cursor-pointer rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRefunding}
              className="px-5 py-2 cursor-pointer rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isRefunding ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Processing via Stripe...
                </>
              ) : (
                <>Confirm & Process Refund</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundModal;
