import React from "react";
import { MapPin, IndianRupee, User, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { Booking, Service, User as UserType } from "@/types";
import { formatDate } from "@/utils/formatters";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusAction } from "@/hooks/useAdminBookings";

interface BookingsTableProps {
  bookings: Booking[];
  updatingId: string | null;
  onStatusAction: (booking: Booking, status: StatusAction) => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  updatingId,
  onStatusAction,
}) => {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1628]/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed text-left">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.025]">
              <th className="w-[105px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Booking ID
              </th>
              <th className="w-[210px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Customer
              </th>
              <th className="w-[190px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Service
              </th>
              <th className="w-[200px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Booking Dates
              </th>
              <th className="w-[120px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Total
              </th>
              <th className="w-[145px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </th>
              <th className="w-[150px] px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.05]">
            {bookings.map((booking) => {
              const user = booking.user as UserType;
              const svc = booking.service as Service;

              return (
                <tr
                  key={booking._id}
                  id={`admin-booking-${booking._id}`}
                  className="transition-colors hover:bg-white/[0.025]"
                >
                  {/* Booking ID */}
                  <td className="px-4 py-5 align-top">
                    <span className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.035] px-2 py-1 font-mono text-[11px] text-slate-400">
                      #{booking._id.slice(-6).toUpperCase()}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-5 align-top">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-300">
                        <User size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">
                          {typeof user === "object" ? user.name : "User"}
                        </p>
                        <p className="mt-1 break-all text-[11px] leading-4 text-slate-500">
                          {typeof user === "object" ? user.email : ""}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-5 align-top">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-200">
                      {svc && typeof svc === "object" ? svc.title : "Service"}
                    </p>

                    {svc && typeof svc === "object" && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{svc.location?.city}</span>
                      </p>
                    )}
                  </td>

                  {/* Booking dates */}
                  <td className="px-4 py-5 align-top">
                    <div className="space-y-1 text-[12px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays
                          size={13}
                          className="shrink-0 text-slate-500"
                        />
                        <span>{formatDate(booking.startDate)}</span>
                      </div>
                      <p className="pl-[19px] text-[11px] text-slate-500">
                        to {formatDate(booking.endDate)}
                      </p>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-5 align-top">
                    <div className="flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-yellow-400">
                      <IndianRupee size={13} />
                      {new Intl.NumberFormat("en-IN").format(booking.totalPrice)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-5 align-top">
                    <StatusBadge status={booking.status} />

                    {booking.refundAmount && booking.refundAmount > 0 ? (
                      <p className="mt-1.5 text-[10px] font-semibold text-cyan-400">
                        Refunded: ₹{new Intl.NumberFormat("en-IN").format(booking.refundAmount)}
                      </p>
                    ) : null}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-5 align-top">
                    <div className="flex flex-col items-start gap-2">
                      {booking.status === "confirmed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onStatusAction(booking, "completed")}
                            disabled={updatingId === booking._id}
                            className="inline-flex cursor-pointer h-8 items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} />
                            Complete
                          </button>

                          <button
                            type="button"
                            onClick={() => onStatusAction(booking, "cancelled")}
                            disabled={updatingId === booking._id}
                            className="inline-flex cursor-pointer h-8 items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-2.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            Cancel
                          </button>
                        </>
                      )}

                      {booking.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => onStatusAction(booking, "cancelled")}
                          disabled={updatingId === booking._id}
                          className="inline-flex cursor-pointer h-8 items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-2.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Cancel booking
                        </button>
                      )}

                      {(booking.status === "cancelled" ||
                        booking.status === "completed") && (
                        <span className="text-[10px] text-slate-500">
                          No further actions
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsTable;
