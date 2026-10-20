import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { ActiveStatusAction } from "@/hooks/useAdminBookings";

interface StatusActionModalProps {
  statusAction: ActiveStatusAction | null;
  updatingId: string | null;
  reason: string;
  onReasonChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const StatusActionModal: React.FC<StatusActionModalProps> = ({
  statusAction,
  updatingId,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
}) => {
  if (!statusAction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-action-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0a1628] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              statusAction.status === "cancelled"
                ? "bg-red-400/[0.09] text-red-400"
                : "bg-emerald-400/[0.09] text-emerald-400"
            }`}
          >
            {statusAction.status === "cancelled" ? (
              <XCircle size={22} />
            ) : (
              <CheckCircle2 size={22} />
            )}
          </div>

          <div>
            <h2
              id="status-action-title"
              className="text-lg font-bold text-white"
            >
              {statusAction.status === "cancelled"
                ? "Cancel booking"
                : "Mark booking complete"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              {statusAction.status === "cancelled"
                ? "This records a permanent cancellation. Paid Stripe bookings must be refunded from Earnings first."
                : "Use this only after the service has been delivered. Completed bookings cannot be reopened."}
            </p>
          </div>
        </div>

        {statusAction.status === "cancelled" && (
          <label
            className="mt-5 block text-sm font-medium text-slate-300"
            htmlFor="cancellation-reason"
          >
            Cancellation reason <span className="text-red-400">*</span>

            <textarea
              id="cancellation-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Explain why this booking is being cancelled"
              className="mt-2 w-full resize-none rounded-xl border border-white/[0.1] bg-[#050d1e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/10"
            />
          </label>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updatingId === statusAction.booking._id}
            className="h-10 rounded-xl cursor-pointer border border-white/[0.1] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            Go back
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={updatingId === statusAction.booking._id}
            className={`h-10 rounded-xl cursor-pointer px-4 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              statusAction.status === "cancelled"
                ? "bg-red-400 hover:bg-red-300"
                : "bg-emerald-400 hover:bg-emerald-300"
            }`}
          >
            {updatingId === statusAction.booking._id
              ? "Saving..."
              : statusAction.status === "cancelled"
                ? "Confirm cancellation"
                : "Mark complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusActionModal;
