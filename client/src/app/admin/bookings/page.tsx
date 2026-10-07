"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, IndianRupee, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking, Service, User as UserType } from "@/types";
import { useAuth } from "@/context/AuthContext";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

export default function AdminBookingsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? { ...b, status: status as Booking["status"] }
            : b,
        ),
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
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
  <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
    {/* Background Glow */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            All Bookings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage and monitor all user bookings.
          </p>
        </div>

        {/* Status Filter */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-11 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-sm text-slate-300 outline-none transition-all duration-200 hover:border-white/[0.15] focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 sm:w-[190px]"
        >
          <option value="">All Statuses</option>

          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-yellow-400" />

            <p className="text-sm text-slate-500">
              Loading bookings...
            </p>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center backdrop-blur-xl">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/[0.04] blur-[90px]" />

          <div className="relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-yellow-400">
              <CalendarDays size={40} strokeWidth={1.7} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              No bookings found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Bookings will appear here once users start booking services.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table / Mobile Cards */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl">
            {/* Desktop Header */}
            <div className="hidden grid-cols-[0.7fr_1.5fr_1.5fr_1.8fr_1fr_1.5fr] gap-4 border-b border-white/[0.07] bg-white/[0.025] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 xl:grid">
              <span>Booking ID</span>
              <span>User</span>
              <span>Service</span>
              <span>Dates</span>
              <span>Total</span>
              <span>Status</span>
            </div>

            {bookings.map((booking) => {
              const user = booking.user as UserType;
              const svc = booking.service as Service;

              return (
                <div
                  key={booking._id}
                  id={`admin-booking-${booking._id}`}
                  className="grid grid-cols-1 gap-4 border-b border-white/[0.06] p-5 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.02] xl:grid-cols-[0.7fr_1.5fr_1.5fr_1.8fr_1fr_1.5fr] xl:items-center"
                >
                  {/* Booking ID */}
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 xl:hidden">
                      Booking ID
                    </p>

                    <div className="w-fit rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-slate-400">
                      #{booking._id.slice(-6).toUpperCase()}
                    </div>
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/10 bg-blue-400/[0.06] text-blue-400">
                      <User size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {typeof user === "object" ? user.name : "User"}
                      </p>

                      <p className="truncate text-[11px] text-slate-500">
                        {typeof user === "object" ? user.email : ""}
                      </p>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {typeof svc === "object" ? svc.title : "Service"}
                    </p>

                    {typeof svc === "object" && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin size={11} />

                        <span className="truncate">
                          {svc.location?.city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-300">
                    <CalendarDays size={13} className="shrink-0 text-slate-500" />

                    <span>{formatDate(booking.startDate)}</span>

                    <span className="text-slate-600">→</span>

                    <span>{formatDate(booking.endDate)}</span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center gap-0.5 text-sm font-bold text-yellow-400">
                    <IndianRupee size={13} strokeWidth={2.5} />

                    {new Intl.NumberFormat("en-IN").format(
                      booking.totalPrice
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <select
                      id={`status-select-${booking._id}`}
                      value={booking.status}
                      onChange={(e) =>
                        updateStatus(booking._id, e.target.value)
                      }
                      disabled={updatingId === booking._id}
                      className="h-9 w-full cursor-pointer rounded-lg border border-white/[0.08] bg-[#0a1628] px-2.5 text-xs text-slate-300 outline-none transition-all duration-200 hover:border-white/[0.15] focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                        STATUS_BADGE[booking.status] ??
                        "border-white/10 bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
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
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                id="admin-prev-page"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <div className="flex h-10 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm text-slate-400">
                Page{" "}
                <span className="mx-1 font-semibold text-white">{page}</span>{" "}
                of{" "}
                <span className="ml-1 font-semibold text-white">
                  {totalPages}
                </span>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                id="admin-next-page"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
}
