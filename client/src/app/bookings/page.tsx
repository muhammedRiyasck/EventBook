"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CancelBookingModal from "@/components/CancelBookingModal";
import { ProtectedRoute } from "@/components/auth/AuthGuards";
import { useUserBookings } from "@/hooks/useUserBookings";
import { BookingTabs } from "@/components/bookings/BookingTabs";
import { BookingItem } from "@/components/bookings/BookingItem";
import { LoadingState } from "@/components/ui/LoadingState";

function BookingsContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const {
    bookings,
    pagination,
    setPage,
    loading,
    activeTab,
    setActiveTab,
    cancellingBooking,
    setCancellingBooking,
    isCancelling,
    retrying,
    handleConfirmCancel,
    handleRetryPayment,
  } = useUserBookings(isAuthenticated);

  if (isLoading) {
    return <LoadingState fullPage />;
  }

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/[0.08] blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-yellow-400/[0.06] blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
              Your Activity
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage and track all your event service bookings.
            </p>
          </div>

          <Link
            href="/services"
            id="find-services-btn"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-slate-950 shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)]"
          >
            <span>Find Services</span>
          </Link>
        </div>

        {/* Tabs */}
        <BookingTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
        />

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-yellow-400" />
              <p className="text-sm text-slate-500">Loading your bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/[0.04] blur-[90px]" />

            <div className="relative z-10 mx-auto max-w-md">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-yellow-400">
                <CalendarDays size={38} strokeWidth={1.7} />
              </div>

              <h3 className="mt-6 text-xl font-bold text-white">
                No bookings yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {activeTab === "upcoming"
                  ? "You have no upcoming bookings."
                  : activeTab === "past"
                    ? "No past bookings found."
                    : activeTab === "cancelled"
                      ? "You have no cancelled bookings."
                      : "You haven't made any bookings yet. Find a service and start planning your event."}
              </p>

              <Link
                href="/services"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-yellow-300 hover:shadow-[0_10px_30px_rgba(250,204,21,0.15)]"
              >
                Browse Services
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingItem
                key={booking._id}
                booking={booking}
                retrying={retrying}
                cancellingBooking={cancellingBooking}
                isCancelling={isCancelling}
                onRetryPayment={handleRetryPayment}
                onCancelBooking={setCancellingBooking}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              id="user-bookings-prev-btn"
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="rounded-xl border border-white/[0.06] bg-[#0a1628]/70 px-5 py-2 text-sm text-slate-400">
              Page{" "}
              <strong className="font-semibold text-white">
                {pagination.currentPage}
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-white">
                {pagination.totalPages}
              </strong>{" "}
              <span className="text-xs text-slate-500">
                ({pagination.totalItems}{" "}
                {pagination.totalItems === 1 ? "booking" : "bookings"})
              </span>
            </div>

            <button
              id="user-bookings-next-btn"
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          onConfirm={handleConfirmCancel}
          onClose={() => !isCancelling && setCancellingBooking(null)}
          isLoading={isCancelling}
        />
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <BookingsContent />
    </ProtectedRoute>
  );
}
