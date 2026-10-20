"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IndianRupee, ChevronLeft, Users, Shield, CalendarRange } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/api";
import { Service } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ServiceImageGallery } from "@/components/services/detail/ServiceImageGallery";
import { ServiceInfoSection } from "@/components/services/detail/ServiceInfoSection";
import { AdminServicePanel } from "@/components/services/detail/AdminServicePanel";
import { CustomerBookingForm } from "@/components/services/detail/CustomerBookingForm";
import { AvailableSlot, fmtDate, hoursBetween } from "@/components/services/detail/types";
import { CANCELLATION_COLOR } from "@/components/services/detail/types";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Booking form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  // Time slot state
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dailyStats, setDailyStats] = useState<{ bookings: number; guests: number } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/services/${id}`);
        setService(data.data);
      } catch {
        toast.error("Service not found");
        router.push("/services");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, router]);

  // Fetch available slots and daily stats when date is picked
  useEffect(() => {
    if (!service || !startDate) {
      setAvailableSlots([]);
      setSelectedSlotId("");
      setDailyStats(null);
      return;
    }
    const fetchSlotsAndStats = async () => {
      setLoadingSlots(true);
      if (service.bookingMode === "time_slot") setSelectedSlotId("");
      try {
        const tzOffset = startDate.getTimezoneOffset() * 60000;
        const localISOTime = new Date(startDate.getTime() - tzOffset)
          .toISOString()
          .split("T")[0];
        const { data } = await api.get(
          `/services/${id}/available-slots?date=${localISOTime}`
        );
        setAvailableSlots(data.data || []);
        setDailyStats(data.dailyStats || null);
      } catch {
        toast.error("Failed to load availability");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlotsAndStats();
  }, [startDate, id, service]);

  const bookingMode = service?.bookingMode ?? "date_range";
  const pricingUnit = service?.pricingUnit ?? "per_day";

  // ── Price Calculation ──────────────────────────────────────────────────────
  const totalDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        )
      : startDate
      ? 1
      : 0;

  const selectedSlot = availableSlots.find((s) => s._id === selectedSlotId);
  const totalHours = selectedSlot
    ? hoursBetween(selectedSlot.startTime, selectedSlot.endTime)
    : 0;

  const parsedGuests = Number(guestCount) || 1;

  const totalPrice = (() => {
    if (!service || totalDays === 0) return 0;
    const base = service.pricePerDay;
    switch (pricingUnit) {
      case "per_hour":
        return base * Math.max(1, totalHours);
      case "per_person":
        return base * Math.max(1, parsedGuests);
      case "per_project":
        return base;
      default:
        return base * totalDays;
    }
  })();

  // ── Price summary label ────────────────────────────────────────────────────
  const priceSummaryLine = (() => {
    if (!service) return "";
    const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
    const base = `₹${fmt(service.pricePerDay)}`;
    switch (pricingUnit) {
      case "per_hour":
        return `${base} × ${totalHours.toFixed(1)} hr${totalHours !== 1 ? "s" : ""}`;
      case "per_person":
        return `${base} × ${parsedGuests} guest${parsedGuests !== 1 ? "s" : ""}`;
      case "per_project":
        return "Fixed project fee";
      default:
        return `${base} × ${totalDays} day${totalDays !== 1 ? "s" : ""}`;
    }
  })();

  const pricingLabel =
    ({
      per_day: "/ day",
      per_hour: "/ hr",
      per_person: "/ person",
      per_project: "flat",
    } as Record<string, string>)[pricingUnit ?? "per_day"] ?? "/ day";

  const pricingUnitLabel =
    ({
      per_day: "per day",
      per_hour: "per hour",
      per_person: "per person",
      per_project: "flat fee",
    } as Record<string, string>)[pricingUnit ?? "per_day"] ?? "per day";

  // ── Booking submit ─────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (isAdmin) {
      toast.error("Administrators cannot book services");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to book a service");
      router.push("/login");
      return;
    }
    if (!startDate) {
      toast.error("Please select a date");
      return;
    }
    if (bookingMode === "date_range" && !endDate) {
      toast.error("Please select an end date");
      return;
    }
    if (bookingMode === "time_slot" && !selectedSlotId) {
      toast.error("Please select a time slot");
      return;
    }
    if (pricingUnit === "per_person" && !guestCount) {
      toast.error("Please enter the number of guests");
      return;
    }
    if (service?.capacity && Number(guestCount) > service.capacity) {
      toast.error(
        `Guest count exceeds maximum capacity of ${service.capacity}`
      );
      return;
    }

    setBooking(true);
    try {
      const effectiveEnd = bookingMode === "date_range" ? endDate : startDate;

      const toLocalDateStr = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split("T")[0];
      };

      const response = await api.post("/bookings", {
        serviceId: id,
        startDate: toLocalDateStr(startDate),
        endDate: toLocalDateStr(effectiveEnd ?? startDate),
        notes,
        ...(selectedSlotId && { timeSlotId: selectedSlotId }),
        ...(guestCount && { guestCount: Number(guestCount) }),
      });

      if (response.data.clientSecret) {
        const bookingId = response.data.data?._id;
        router.push(
          `/checkout?clientSecret=${response.data.clientSecret}&bookingId=${bookingId}`
        );
      } else {
        toast.success("🎉 Booking confirmed! Check your email.");
        router.push("/bookings");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string; pendingBookingId?: string };
        };
      };
      if (
        error.response?.status === 409 &&
        error.response.data?.pendingBookingId
      ) {
        toast.error(
          "You already have a pending booking. Continue its payment from My Bookings."
        );
        router.push("/bookings");
        return;
      }
      toast.error(error?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  // ── Book button disabled state ─────────────────────────────────────────────
  const isBookDisabled = (() => {
    if (booking || !startDate) return true;
    if (bookingMode === "date_range" && !endDate) return true;
    if (bookingMode === "time_slot" && !selectedSlotId) return true;
    if (pricingUnit === "per_person" && !guestCount) return true;
    if (service?.capacity) {
      const remainingCapacity = service.capacity - (dailyStats?.guests || 0);
      if (Number(guestCount) > remainingCapacity) return true;
    }
    if (
      service?.maxBookingsPerDay &&
      dailyStats &&
      dailyStats.bookings >= service.maxBookingsPerDay
    ) {
      return true;
    }
    return false;
  })();

  if (loading) {
    return (
      <div className="page-wrapper pt-[100px] pb-[80px]">
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!service) return null;

  const images = service.images?.length ? service.images : [];
  const formattedPrice = new Intl.NumberFormat("en-IN").format(
    service.pricePerDay
  );
  const cancelStyle = service.cancellationPolicy
    ? CANCELLATION_COLOR[service.cancellationPolicy]
    : null;

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-yellow-400/10 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/[0.08] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Back */}
        <Link
          href="/services"
          className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-yellow-400 "
        >
          <ChevronLeft size={17} className="cursor-pointer" />
          Back to Services
        </Link>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* =========================================================
              LEFT CONTENT
          ========================================================= */}
          <div className="min-w-0">
            <ServiceImageGallery
              images={images}
              title={service.title}
              category={service.category}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
            />

            <ServiceInfoSection
              service={service}
              formattedPrice={formattedPrice}
              pricingUnitLabel={pricingUnitLabel}
            />
          </div>

          {/* =========================================================
              RIGHT: BOOKING CARD
          ========================================================= */}
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a1628]/90 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
              {/* Card Header */}
              <div className="border-b border-white/[0.07] p-6 sm:p-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Booking price
                </p>

                <div className="flex items-end gap-2">
                  <div className="flex items-center text-yellow-400">
                    <IndianRupee size={23} strokeWidth={2.5} />
                    <span className="text-4xl font-black tracking-tight">
                      {formattedPrice}
                    </span>
                  </div>

                  <span className="mb-1 text-sm text-slate-500">
                    {pricingLabel}
                  </span>
                </div>

                {/* Quick info pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.capacity && (
                    <p className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
                      <Users size={11} />
                      Max {service.capacity} guests
                    </p>
                  )}
                  {service.cancellationPolicy && cancelStyle && (
                    <p
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${cancelStyle.border} ${cancelStyle.bg} ${cancelStyle.text}`}
                    >
                      <Shield size={11} />
                      {service.cancellationPolicy}
                    </p>
                  )}
                  {service.availableFrom && (
                    <p className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
                      <CalendarRange size={11} />
                      From {fmtDate(service.availableFrom)}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Management Panel or Customer Booking Form */}
              {isAdmin ? (
                <AdminServicePanel
                  service={service}
                  bookingMode={bookingMode}
                />
              ) : (
                <CustomerBookingForm
                  service={service}
                  bookingMode={bookingMode}
                  pricingUnit={pricingUnit}
                  pricingUnitLabel={pricingUnitLabel}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  availableSlots={availableSlots}
                  selectedSlotId={selectedSlotId}
                  setSelectedSlotId={setSelectedSlotId}
                  loadingSlots={loadingSlots}
                  guestCount={guestCount}
                  setGuestCount={setGuestCount}
                  dailyStats={dailyStats}
                  notes={notes}
                  setNotes={setNotes}
                  totalDays={totalDays}
                  selectedSlot={selectedSlot}
                  totalHours={totalHours}
                  totalPrice={totalPrice}
                  priceSummaryLine={priceSummaryLine}
                  booking={booking}
                  isBookDisabled={isBookDisabled}
                  isAuthenticated={isAuthenticated}
                  onBook={handleBook}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
