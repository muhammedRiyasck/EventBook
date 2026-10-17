"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, IndianRupee, User, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking, Service, User as UserType } from "@/types";
import { useAuth } from "@/context/AuthContext";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

type StatusAction = "cancelled" | "completed";

export default function AdminBookingsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{
    booking: Booking;
    status: StatusAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchBookings = async (pg = 1, status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "15" });
      if (status) params.set("status", status);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      setBookings(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBookings(page, statusFilter);
  }, [isAdmin, page, statusFilter]);

  const updateStatus = async (
    bookingId: string,
    status: StatusAction,
    statusReason?: string,
  ) => {
    setUpdatingId(bookingId);
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/status`, {
        status,
        ...(statusReason && { reason: statusReason }),
      });
      toast.success(`Booking marked as ${status}`);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? data.data
            : b,
        ),
      );
      setStatusAction(null);
      setReason("");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Status update failed";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openStatusAction = (booking: Booking, status: StatusAction) => {
    setReason("");
    setStatusAction({ booking, status });
  };

  const submitStatusAction = () => {
    if (!statusAction) return;
    if (statusAction.status === "cancelled" && !reason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    updateStatus(statusAction.booking._id, statusAction.status, reason.trim());
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const STATUS_BADGE: Record<string, string> = {
    confirmed: "badge-confirmed",
    pending: "badge-pending",
    cancelled: "badge-cancelled",
    completed: "badge-completed",
  };

  if (isLoading || !isAdmin) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
  <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
    {/* Background glows */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
            Administration
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            All Bookings
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review bookings, monitor statuses, and manage cancellations.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:w-[200px]">
          <label
            htmlFor="status-filter"
            className="text-xs font-medium text-slate-400"
          >
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-sm text-slate-200 outline-none transition focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading and empty states */}
      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-yellow-400" />
          <p className="text-sm text-slate-400">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-yellow-400">
            <CalendarDays size={32} strokeWidth={1.6} />
          </div>

          <h3 className="mt-5 text-xl font-bold text-white">
            No bookings found
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            {statusFilter
              ? `There are no bookings with the "${statusFilter}" status. Try another filter.`
              : "Bookings will appear here once users start booking services."}
          </p>

          {statusFilter && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className="mt-5 cursor-pointer rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] px-4 py-2.5 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/10"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: bookings table */}
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
                                {typeof user === "object"
                                  ? user.name
                                  : "User"}
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
                            {svc && typeof svc === "object"
                              ? svc.title
                              : "Service"}
                          </p>

                          {svc && typeof svc === "object" && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">
                                {svc.location?.city}
                              </span>
                            </p>
                          )}
                        </td>

                        {/* Booking dates */}
                        <td className="px-4 py-5 align-top">
                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={14}
                              className="mt-0.5 shrink-0 text-slate-500"
                            />

                            <div className="text-xs leading-5">
                              <p className="text-slate-200">
                                {formatDate(booking.startDate)}
                              </p>
                              <p className="text-slate-500">
                                to {formatDate(booking.endDate)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-5 align-top">
                          <div className="flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-yellow-400">
                            <IndianRupee size={13} />
                            {new Intl.NumberFormat("en-IN").format(
                              booking.totalPrice
                            )}
                          </div>
                        </td>

                        {/* Status: badge only */}
                        <td className="px-4 py-5 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                              STATUS_BADGE[booking.status] ??
                              "border-white/10 bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                booking.status === "confirmed"
                                  ? "bg-emerald-400"
                                  : booking.status === "pending"
                                    ? "bg-yellow-400"
                                    : booking.status === "cancelled"
                                      ? "bg-red-400"
                                      : "bg-slate-400"
                              }`}
                            />
                            {booking.status}
                          </span>

                          {booking.refundAmount && booking.refundAmount > 0 ? (
                            <p className="mt-1.5 text-[10px] font-semibold text-cyan-400">
                              Refunded: ₹{new Intl.NumberFormat("en-IN").format(booking.refundAmount)}
                            </p>
                          ) : null}
                        </td>

                        {/* Actions: buttons belong here */}
                        <td className="px-4 py-5 align-top">
                          <div className="flex flex-col items-start gap-2">
                            {booking.status === "confirmed" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openStatusAction(booking, "completed")
                                  }
                                  disabled={updatingId === booking._id}
                                  className="inline-flex cursor-pointer h-8 items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <CheckCircle2 size={13} />
                                  Complete
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openStatusAction(booking, "cancelled")
                                  }
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
                                onClick={() =>
                                  openStatusAction(booking, "cancelled")
                                }
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

          {/* Mobile and tablet: booking cards */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {bookings.map((booking) => {
              const user = booking.user as UserType;
              const svc = booking.service as Service;

              return (
                <article
                  key={booking._id}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
                    <span className="font-mono text-xs text-slate-400">
                      #{booking._id.slice(-6).toUpperCase()}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                        STATUS_BADGE[booking.status] ??
                        "border-white/10 bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-emerald-400"
                            : booking.status === "pending"
                              ? "bg-yellow-400"
                              : booking.status === "cancelled"
                                ? "bg-red-400"
                                : "bg-slate-400"
                        }`}
                      />
                      {booking.status}
                    </span>
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
                            {typeof user === "object"
                              ? user.name
                              : "User"}
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
                        {svc && typeof svc === "object"
                          ? svc.title
                          : "Service"}
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
                        {new Intl.NumberFormat("en-IN").format(
                          booking.totalPrice
                        )}
                      </p>
                    </div>

                    {/* Mobile actions */}
                    {(booking.status === "confirmed" ||
                      booking.status === "pending") && (
                      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                        {booking.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() =>
                              openStatusAction(booking, "completed")
                            }
                            disabled={updatingId === booking._id}
                            className="inline-flex cursor-pointer h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/[0.14] disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Complete
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openStatusAction(booking, "cancelled")
                          }
                          disabled={updatingId === booking._id}
                          className="inline-flex cursor-pointer h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/[0.14] disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </div>
                    )}

                    {(booking.status === "cancelled" ||
                      booking.status === "completed") && (
                      <p className="border-t border-white/[0.06] pt-3 text-center text-xs text-slate-500">
                        This booking has a final status.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                id="admin-prev-page"
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <div className="flex h-10 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm text-slate-400">
                Page{" "}
                <span className="mx-1 font-semibold text-white">{page}</span>
                of{" "}
                <span className="ml-1 font-semibold text-white">
                  {totalPages}
                </span>
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                id="admin-next-page"
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>

    {/* Confirmation modal */}
    {statusAction && (
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
                onChange={(event) => setReason(event.target.value)}
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
              onClick={() => setStatusAction(null)}
              disabled={updatingId === statusAction.booking._id}
              className="h-10 rounded-xl cursor-pointer border border-white/[0.1] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              Go back
            </button>

            <button
              type="button"
              onClick={submitStatusAction}
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
    )}
  </div>
);
}
