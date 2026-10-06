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
    <div className="page-wrapper pt-[100px] pb-[80px]">
      <div className="container">
        <div className="flex items-center justify-between mb-7 gap-4">
          <h1 className="section-title">All Bookings</h1>
          <select
            id="status-filter"
            className="form-input w-[180px]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CalendarDays size={48} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              No bookings found
            </h3>
            <p>Bookings will appear here once users start booking services.</p>
          </div>
        ) : (
          <>
            <div className="bg-white/2 border border-white/10 rounded-lg overflow-hidden xl:bg-white/2 xl:border-white/10 max-xl:bg-transparent max-xl:border-none max-xl:overflow-visible">
              <div className="hidden xl:grid grid-cols-[0.7fr_1.5fr_1.5fr_1.8fr_1fr_1.5fr] gap-3 py-3 px-5 bg-white/4 border-b border-white/10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                    className="grid grid-cols-1 xl:grid-cols-[0.7fr_1.5fr_1.5fr_1.8fr_1fr_1.5fr] gap-3 py-3.5 px-5 border-b border-white/4 items-center transition-colors duration-150 animate-[fadeIn_0.3s_ease] last:border-b-0 hover:bg-white/2 max-xl:border max-xl:border-white/10 max-xl:rounded-md max-xl:mb-3"
                    id={`admin-booking-${booking._id}`}
                  >
                    <div className="font-mono text-[12px] text-slate-400 bg-white/5 py-0.5 px-1.5 rounded w-fit">
                      #{booking._id.slice(-6).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={13} />
                      <div>
                        <div className="text-[13px] font-semibold text-white">
                          {typeof user === "object" ? user.name : "User"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {typeof user === "object" ? user.email : ""}
                        </div>
                      </div>
                    </div>

                    <div className="text-[13px] font-semibold text-white">
                      {typeof svc === "object" ? svc.title : "Service"}
                      {typeof svc === "object" && (
                        <div className="flex items-center gap-[3px] text-[11px] text-slate-500 mt-0.5">
                          <MapPin size={11} /> {svc.location?.city}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[12px] text-slate-300 flex-wrap">
                      <CalendarDays size={12} />
                      <span>{formatDate(booking.startDate)}</span>
                      <span style={{ color: "var(--slate-600)" }}>→</span>
                      <span>{formatDate(booking.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-[14px] font-bold text-[var(--gold-400)] font-display">
                      <IndianRupee size={13} />
                      {new Intl.NumberFormat("en-IN").format(
                        booking.totalPrice,
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <select
                        id={`status-select-${booking._id}`}
                        className="form-input !text-[12px] !py-1 !px-2 !rounded-md w-full"
                        value={booking.status}
                        onChange={(e) =>
                          updateStatus(booking._id, e.target.value)
                        }
                        disabled={updatingId === booking._id}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                      <span
                        className={`badge ${STATUS_BADGE[booking.status]} w-fit`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-5 mt-8">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  id="admin-prev-page"
                >
                  ← Previous
                </button>
                <span className="text-[14px] text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  id="admin-next-page"
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
