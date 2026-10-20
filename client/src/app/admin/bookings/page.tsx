"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminBookings } from "@/hooks/useAdminBookings";
import { BookingsTable } from "@/components/admin/bookings/BookingsTable";
import { BookingCard } from "@/components/admin/bookings/BookingCard";
import { StatusActionModal } from "@/components/admin/bookings/StatusActionModal";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

export default function AdminBookingsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const {
    bookings,
    loading,
    statusFilter,
    setStatusFilter,
    updatingId,
    statusAction,
    setStatusAction,
    reason,
    setReason,
    page,
    setPage,
    totalPages,
    openStatusAction,
    submitStatusAction,
  } = useAdminBookings(isAdmin);

  if (isLoading || !isAdmin) {
    return <LoadingState fullPage />;
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
          <EmptyState
            icon={<CalendarDays size={32} strokeWidth={1.6} />}
            title="No bookings found"
            description={
              statusFilter
                ? `There are no bookings with the "${statusFilter}" status. Try another filter.`
                : "Bookings will appear here once users start booking services."
            }
            actionLabel={statusFilter ? "Clear filter" : undefined}
            onAction={
              statusFilter
                ? () => {
                    setStatusFilter("");
                    setPage(1);
                  }
                : undefined
            }
            className="min-h-[340px] px-6 py-14"
          />
        ) : (
          <>
            {/* Desktop: bookings table */}
            <BookingsTable
              bookings={bookings}
              updatingId={updatingId}
              onStatusAction={openStatusAction}
            />

            {/* Mobile and tablet: booking cards */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  updatingId={updatingId}
                  onStatusAction={openStatusAction}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              prevId="admin-prev-page"
              nextId="admin-next-page"
              className="mt-8"
            />
          </>
        )}
      </div>

      {/* Confirmation modal */}
      <StatusActionModal
        statusAction={statusAction}
        updatingId={updatingId}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setStatusAction(null)}
        onSubmit={submitStatusAction}
      />
    </div>
  );
}
