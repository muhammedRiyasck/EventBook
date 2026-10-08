"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, IndianRupee, X, Clock, Users, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking, Service } from "@/types";
import { useAuth } from "@/context/AuthContext";

type TabType = "all" | "upcoming" | "past";

export default function BookingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  const fetchBookings = async (tab: TabType) => {
    setLoading(true);
    try {
      const params = tab !== "all" ? `?type=${tab}` : "";
      const { data } = await api.get(`/bookings/my${params}`);
      setBookings(data.data);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchBookings(activeTab);
  }, [activeTab, isAuthenticated]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled");
      fetchBookings(activeTab);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Cancellation failed");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (isLoading)
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

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/[0.08] blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-yellow-400/[0.06] blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* =========================================================
          HEADER
      ========================================================= */}
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

        {/* =========================================================
          TABS
      ========================================================= */}
        <div className="mb-7 inline-flex max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 backdrop-blur-xl">
          {(["all", "upcoming", "past"] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer  ${
                  isActive
                    ? "bg-yellow-400/10 text-yellow-400 shadow-sm"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* =========================================================
          CONTENT
      ========================================================= */}
        {loading ? (
          /* Loading */
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-yellow-400" />
              <p className="text-sm text-slate-500">Loading your bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          /* =========================================================
           EMPTY STATE
        ========================================================= */
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center">
            {/* Glow */}
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
          /* =========================================================
           BOOKING LIST
        ========================================================= */
          <div className="space-y-4">
            {bookings.map((booking) => {
              const svc = booking.service as Service;

              const isActive =
                booking.status === "confirmed" || booking.status === "pending";

              return (
                <div
                  key={booking._id}
                  id={`booking-${booking._id}`}
                  className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition-all duration-300 hover:border-yellow-400/20 hover:bg-white/[0.045] sm:p-6"
                >
                  {/* =================================================
                    TOP
                ================================================= */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        {/* Service icon */}
                        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-yellow-400 sm:flex">
                          <CalendarDays size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-white sm:text-lg">
                            {typeof svc === "object" ? svc.title : "Service"}
                          </h3>

                          {typeof svc === "object" && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={13} className="shrink-0" />

                              <span className="truncate">
                                {svc.location?.city}, {svc.location?.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                        booking.status === "confirmed"
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                          : booking.status === "pending"
                            ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                            : booking.status === "cancelled"
                              ? "border-red-400/20 bg-red-400/10 text-red-400"
                              : "border-white/10 bg-white/[0.05] text-slate-400"
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

                  {/* =================================================
                    BOOKING DETAILS
                ================================================= */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {/* Dates */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        <CalendarDays size={13} />
                        Booking Dates
                      </div>

                      <p className="text-sm font-medium text-slate-300">
                        {formatDate(booking.startDate)}
                        <span className="mx-2 text-slate-600">→</span>
                        {formatDate(booking.endDate)}
                      </p>
                    </div>

                    {/* Duration / Time Slot */}
                    {booking.startTime && booking.endTime ? (
                      <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
                        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          <Clock size={13} />
                          Time Slot
                        </div>
                        <p className="text-sm font-medium text-slate-300">
                          {booking.startTime} – {booking.endTime}
                          {booking.totalHours && (
                            <span className="ml-2 text-xs text-slate-500">({booking.totalHours.toFixed(1)} hrs)</span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Duration
                        </div>
                        <p className="text-sm font-medium text-slate-300">
                          {booking.totalDays} day{booking.totalDays > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {/* Guest Count */}
                    {booking.guestCount && (
                      <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
                        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          <Users size={13} />
                          Guests
                        </div>
                        <p className="text-sm font-medium text-slate-300">
                          {booking.guestCount} guest{booking.guestCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/[0.08] p-3.5">
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        <CreditCard size={13} />
                        Payment
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                        booking.paymentStatus === "paid"
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                          : "border-orange-400/20 bg-orange-400/10 text-orange-400"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          booking.paymentStatus === "paid" ? "bg-emerald-400" : "bg-orange-400"
                        }`} />
                        {booking.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                    NOTES
                ================================================= */}
                  {booking.notes && (
                    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Special Request
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-400">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* =================================================
                    FOOTER
                ================================================= */}
                  <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Price */}
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        Total Amount
                      </p>

                      <div className="flex items-center gap-0.5 text-xl font-black text-yellow-400">
                        <IndianRupee size={16} strokeWidth={2.5} />

                        <span>
                          {new Intl.NumberFormat("en-IN").format(
                            booking.totalPrice,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Cancel */}
                    {isActive && (
                      <button
                        id={`cancel-booking-${booking._id}`}
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelling === booking._id}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-4 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-400/25 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {cancelling === booking._id ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X size={15} />
                            Cancel Booking
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
