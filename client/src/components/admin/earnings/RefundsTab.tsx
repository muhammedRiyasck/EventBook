import React from "react";
import { Download, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { PopulatedBooking } from "./types";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

interface RefundsTabProps {
  refundsList: PopulatedBooking[];
  loadingRefunds: boolean;
  refundsPage: number;
  refundsTotalPages: number;
  refundsTotalItems: number;
  onPageChange: (newPage: number) => void;
  onExportCSV: () => void;
}

export const RefundsTab: React.FC<RefundsTabProps> = ({
  refundsList,
  loadingRefunds,
  refundsPage,
  refundsTotalPages,
  refundsTotalItems,
  onPageChange,
  onExportCSV,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Refund History & Audit Log
          </h2>
          <p className="text-xs text-slate-400">
            All customer refund requests executed through the Stripe gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-300 hover:text-white"
        >
          <Download size={13} /> Export Refunds
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Refund Amount</th>
                <th className="py-3.5 px-4">Total Booking</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {loadingRefunds ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                      Loading refund audit log...
                    </div>
                  </td>
                </tr>
              ) : refundsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RotateCcw className="mx-auto text-slate-600 mb-2" size={32} />
                    <p className="text-sm font-semibold text-white">
                      No refunds recorded
                    </p>
                    <p className="text-xs text-slate-500">
                      No transactions have been refunded yet.
                    </p>
                  </td>
                </tr>
              ) : (
                refundsList.map((rf) => (
                  <tr
                    key={rf._id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      #{rf._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">
                        {rf.user?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rf.user?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">
                        {rf.service?.title}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {rf.service?.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-400 text-[13px]">
                      {formatCurrency(rf.refundAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatCurrency(rf.totalPrice)}
                    </td>
                    <td
                      className="py-3.5 px-4 max-w-[200px] truncate text-slate-300"
                      title={rf.refundReason}
                    >
                      {rf.refundReason || "No reason specified"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Succeeded
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {rf.refundedAt
                        ? formatDateTime(rf.refundedAt)
                        : formatDateTime(rf.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Refunds Pagination */}
        {refundsTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-4 py-3">
            <span className="text-xs text-slate-400">
              Page{" "}
              <span className="text-white font-semibold">{refundsPage}</span> of{" "}
              <span className="text-white font-semibold">
                {refundsTotalPages}
              </span>{" "}
              ({refundsTotalItems} total refunds)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, refundsPage - 1))}
                disabled={refundsPage === 1}
                className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(refundsTotalPages, refundsPage + 1))}
                disabled={refundsPage === refundsTotalPages}
                className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundsTab;
