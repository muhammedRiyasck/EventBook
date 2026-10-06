"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, IndianRupee, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking, Service } from "@/types";
import { useAuth } from "@/context/AuthContext";

type TabType = "all" | "upcoming" | "past";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "badge-confirmed",
  pending: "badge-pending",
  cancelled: "badge-cancelled",
  completed: "badge-completed",
};

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
    <div className="page-wrapper pt-[100px] pb-[80px]">
      <div className="container">
        <div className="flex items-center justify-between mb-7 gap-4">
          <h1 className="section-title">My Bookings</h1>
          <Link
            href="/services"
            className="btn btn-primary btn-sm"
            id="find-services-btn"
          >
            Find Services
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-7 bg-white/3 border border-white/10 rounded-full p-1 w-fit">
          {(["all", "upcoming", "past"] as TabType[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`py-[7px] px-5 rounded-full text-[14px] font-medium text-slate-400 bg-transparent transition-all duration-200 hover:text-white ${activeTab === tab ? "bg-[#ffd700]/12 !text-[var(--gold-400)] font-semibold" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
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
              No bookings yet
            </h3>
            <p>
              {activeTab === "upcoming"
                ? "You have no upcoming bookings"
                : activeTab === "past"
                  ? "No past bookings found"
                  : "You haven't made any bookings yet"}
            </p>
            <Link
              href="/services"
              className="btn btn-primary"
              style={{ marginTop: 24 }}
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => {
              const svc = booking.service as Service;
              const isActive =
                booking.status === "confirmed" || booking.status === "pending";
              return (
                <div
                  key={booking._id}
                  className="bg-white/5 border border-white/10 rounded-lg py-5 px-6 transition-colors duration-200 animate-[fadeInUp_0.3s_ease] hover:border-[#ffd700]/20"
                  id={`booking-${booking._id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-[16px] font-bold text-white mb-1">
                        {typeof svc === "object" ? svc.title : "Service"}
                      </h3>
                      {typeof svc === "object" && (
                        <div className="flex items-center gap-1 text-[12px] text-slate-500">
                          <MapPin size={12} /> {svc.location?.city},{" "}
                          {svc.location?.state}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex gap-5 flex-wrap mb-3.5">
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-300">
                      <CalendarDays size={14} />
                      <span>
                        {formatDate(booking.startDate)} →{" "}
                        {formatDate(booking.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-300">
                      <span style={{ color: "var(--slate-500)" }}>
                        {booking.totalDays} day
                        {booking.totalDays > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-[3px] text-[18px] font-extrabold text-[var(--gold-400)] font-display">
                      <IndianRupee size={14} />
                      <span>
                        {new Intl.NumberFormat("en-IN").format(
                          booking.totalPrice,
                        )}
                      </span>
                    </div>
                    {isActive && (
                      <button
                        id={`cancel-booking-${booking._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelling === booking._id}
                      >
                        <X size={14} />
                        {cancelling === booking._id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>

                  {booking.notes && (
                    <p className="mt-2.5 text-[13px] text-slate-500 py-2 px-3 bg-white/3 rounded-sm border-l-2 border-white/10">
                      📝 {booking.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
