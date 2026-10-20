import React, { useId } from "react";
import { Search, X, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { PopulatedBooking } from "./types";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { getPaymentStatusBadge, getBookingStatusBadge } from "./badges";

interface TransactionsTabProps {
  transactions: PopulatedBooking[];
  loadingTx: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  search: string;
  onSearchChange: (val: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (val: string) => void;
  bookingStatusFilter: string;
  onBookingStatusChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onClearFilters: () => void;
  onViewDetails: (tx: PopulatedBooking) => void;
  onOpenRefund: (tx: PopulatedBooking) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  loadingTx,
  page,
  totalPages,
  totalItems,
  onPageChange,
  search,
  onSearchChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  bookingStatusFilter,
  onBookingStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  onViewDetails,
  onOpenRefund,
}) => {
  const searchInputId = useId();
  const paymentStatusFilterId = useId();
  const bookingStatusFilterId = useId();
  const startDateFilterId = useId();
  const endDateFilterId = useId();

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-xl md:grid-cols-12">
        {/* Search input */}
        <div className="relative md:col-span-4">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            id={searchInputId}
            type="text"
            placeholder="Search customer, booking ID, or Stripe PI..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* Payment Status */}
        <div className="md:col-span-2">
          <select
            id={paymentStatusFilterId}
            value={paymentStatusFilter}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className="h-10 cursor-pointer w-full rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none transition-all focus:border-yellow-400/40"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="refunded">Fully Refunded</option>
          </select>
        </div>

        {/* Booking Status */}
        <div className="md:col-span-2">
          <select
            id={bookingStatusFilterId}
            value={bookingStatusFilter}
            onChange={(e) => onBookingStatusChange(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none transition-all focus:border-yellow-400/40"
          >
            <option value="all">All Booking Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 md:col-span-3">
          <input
            id={startDateFilterId}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-10 w-1/2 cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-2.5 text-xs text-slate-300 outline-none focus:border-yellow-400/40"
            title="Start Date"
          />
          <input
            id={endDateFilterId}
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-10 w-1/2 cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-2.5 text-xs text-slate-300 outline-none focus:border-yellow-400/40"
            title="End Date"
          />
        </div>

        {/* Clear */}
        <div className="flex items-center gap-2 md:col-span-1">
          {(search ||
            paymentStatusFilter !== "all" ||
            bookingStatusFilter !== "all" ||
            startDate ||
            endDate) && (
            <button
              type="button"
              onClick={onClearFilters}
              className="h-10 px-2 cursor-pointer rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors w-full flex items-center justify-center gap-1"
              title="Reset filters"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Transaction / ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Gateway Status</th>
                <th className="py-3.5 px-4">Booking Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {loadingTx ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-400">
                      <div className="w-5 h-5 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                      Loading online transactions...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <CreditCard className="mx-auto text-slate-600" size={36} />
                      <p className="text-sm font-semibold text-white">
                        No transactions found
                      </p>
                      <p className="text-xs text-slate-500">
                        No payments match the current search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const remaining = Math.max(
                    0,
                    tx.totalPrice - (tx.refundAmount || 0)
                  );
                  const canRefund =
                    tx.paymentStatus === "paid" ||
                    (tx.paymentStatus === "partially_refunded" && remaining > 0);

                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Booking ID & Gateway reference */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-white font-semibold">
                          #{tx._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          {tx.stripePaymentIntentId ? (
                            <span
                              className="truncate max-w-[120px]"
                              title={tx.stripePaymentIntentId}
                            >
                              {tx.stripePaymentIntentId.slice(0, 14)}...
                            </span>
                          ) : (
                            <span className="text-amber-500/70">
                              Gateway record
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">
                          {tx.user?.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tx.user?.email || "—"}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4">
                        <div
                          className="font-medium text-white max-w-[170px] truncate"
                          title={tx.service?.title}
                        >
                          {tx.service?.title || "Service"}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {tx.service?.category || "General"}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-[13px]">
                          {formatCurrency(tx.totalPrice)}
                        </div>
                        {tx.refundAmount && tx.refundAmount > 0 ? (
                          <div className="text-[10px] text-rose-400 mt-0.5">
                            - {formatCurrency(tx.refundAmount)} refunded
                          </div>
                        ) : null}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        {getPaymentStatusBadge(tx.paymentStatus)}
                      </td>

                      {/* Booking Status */}
                      <td className="py-3.5 px-4">
                        {getBookingStatusBadge(tx.status)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDateTime(tx.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDetails(tx)}
                            className="px-2.5 py-1.5 cursor-pointer rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium transition-colors"
                            title="View details & receipt"
                          >
                            Details
                          </button>
                          {canRefund && (
                            <button
                              type="button"
                              onClick={() => onOpenRefund(tx)}
                              className="px-2.5 py-1.5 cursor-pointer rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors"
                              title="Issue full or partial refund via gateway"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-4 py-3">
            <span className="text-xs text-slate-400">
              Page <span className="text-white font-semibold">{page}</span> of{" "}
              <span className="text-white font-semibold">{totalPages}</span> (
              {totalItems} total transactions)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
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

export default TransactionsTab;
