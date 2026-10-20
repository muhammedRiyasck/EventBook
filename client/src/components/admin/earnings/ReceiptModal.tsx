import React from "react";
import { Printer, X } from "lucide-react";
import { PopulatedBooking } from "./types";
import { formatDate, formatCurrency } from "@/utils/formatters";

interface ReceiptModalProps {
  show: boolean;
  selectedTx: PopulatedBooking | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  show,
  selectedTx,
  onClose,
}) => {
  if (!show || !selectedTx) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white text-slate-900 p-8 shadow-2xl max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none">
        {/* Header Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tax Invoice / Official Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Printer size={14} /> Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg cursor-pointer text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div id="printable-receipt" className="space-y-6 text-sm">
          {/* Brand & Invoice Meta */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">EventBook</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Online Event & Venue Booking Platform
              </p>
              <p className="text-xs text-slate-500">support@eventbook.com</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400">
                INVOICE NUMBER
              </span>
              <p className="font-mono font-bold text-base text-slate-900">
                INV-{selectedTx._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Date: {formatDate(selectedTx.createdAt)}
              </p>
              <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                Status: PAID (GATEWAY)
              </p>
            </div>
          </div>

          {/* Billed To & Service Details */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Billed To
              </h4>
              <p className="font-bold text-slate-900 text-sm">
                {selectedTx.user?.name}
              </p>
              <p className="text-slate-600">{selectedTx.user?.email}</p>
              {selectedTx.user?.phone && (
                <p className="text-slate-600">Phone: {selectedTx.user.phone}</p>
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Booking Reference
              </h4>
              <p className="font-mono text-slate-900">ID: {selectedTx._id}</p>
              <p className="text-slate-600">
                Event Dates: {formatDate(selectedTx.startDate)} to{" "}
                {formatDate(selectedTx.endDate)}
              </p>
              {selectedTx.startTime && (
                <p className="text-slate-600">
                  Slot: {selectedTx.startTime} - {selectedTx.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-2.5 px-3">Service Description</th>
                <th className="py-2.5 px-3">Duration / Units</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900">
                    {selectedTx.service?.title}
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    {selectedTx.service?.category} booking
                  </p>
                </td>
                <td className="py-3 px-3 text-slate-600">
                  {selectedTx.totalDays} day(s)
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatCurrency(selectedTx.totalPrice)}
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {formatCurrency(selectedTx.totalPrice)}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50/50">
              <tr>
                <td
                  colSpan={3}
                  className="py-2.5 px-3 text-right font-bold text-slate-700"
                >
                  Subtotal:
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatCurrency(selectedTx.totalPrice)}
                </td>
              </tr>
              {selectedTx.refundAmount && selectedTx.refundAmount > 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-2 px-3 text-right font-semibold text-rose-600"
                  >
                    Refund Issued:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-rose-600">
                    - {formatCurrency(selectedTx.refundAmount)}
                  </td>
                </tr>
              ) : null}
              <tr className="border-t border-slate-300">
                <td
                  colSpan={3}
                  className="py-3 px-3 text-right font-black text-slate-900 text-sm"
                >
                  Net Settled:
                </td>
                <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                  {formatCurrency(
                    Math.max(
                      0,
                      selectedTx.totalPrice - (selectedTx.refundAmount || 0)
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Gateway Footer */}
          <div className="pt-4 border-t text-[11px] text-slate-500 space-y-1">
            <p>
              <span className="font-semibold text-slate-700">
                Payment Gateway:
              </span>{" "}
              Online via Stripe Payments
            </p>
            {selectedTx.stripePaymentIntentId && (
              <p className="font-mono">
                <span className="font-semibold text-slate-700">
                  Gateway Transaction ID:
                </span>{" "}
                {selectedTx.stripePaymentIntentId}
              </p>
            )}
            <p className="text-[10px] text-slate-400 pt-2">
              This is an electronically generated invoice and does not require a
              physical signature. Thank you for choosing EventBook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
