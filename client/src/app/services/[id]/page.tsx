"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  IndianRupee,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/api";
import { Service } from "@/types";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_ICONS: Record<string, string> = {
  venue: "🏛️",
  hotel: "🏨",
  caterer: "🍽️",
  cameraman: "📷",
  dj: "🎧",
  decorator: "🌸",
  other: "✨",
};

interface AvailableSlot {
  _id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  bookedCount: number;
  isAvailable: boolean;
}

// Derive hours from HH:mm strings
const hoursBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

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

  // Fetch available slots when date is picked (time_slot mode only)
  useEffect(() => {
    if (!service || service.bookingMode !== "time_slot" || !startDate) {
      setAvailableSlots([]);
      setSelectedSlotId("");
      return;
    }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlotId("");
      try {
        const dateStr = startDate.toISOString().split("T")[0];
        const { data } = await api.get(
          `/services/${id}/available-slots?date=${dateStr}`
        );
        setAvailableSlots(data.data || []);
      } catch {
        toast.error("Failed to load time slots");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
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

  const pricingLabel = (({
    per_day: "/ day",
    per_hour: "/ hr",
    per_person: "/ person",
    per_project: "flat",
  } as Record<string, string>)[pricingUnit ?? "per_day"]) ?? "/ day";

  // ── Booking submit ─────────────────────────────────────────────────────────
  const handleBook = async () => {
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
    if (
      service?.capacity &&
      Number(guestCount) > service.capacity
    ) {
      toast.error(`Guest count exceeds maximum capacity of ${service.capacity}`);
      return;
    }

    setBooking(true);
    try {
      const effectiveEnd =
        bookingMode === "date_range" ? endDate : startDate;

      await api.post("/bookings", {
        serviceId: id,
        startDate: startDate.toISOString(),
        endDate: (effectiveEnd ?? startDate).toISOString(),
        notes,
        ...(selectedSlotId && { timeSlotId: selectedSlotId }),
        ...(guestCount && { guestCount: Number(guestCount) }),
      });
      toast.success("🎉 Booking confirmed! Check your email.");
      router.push("/bookings");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
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
            {/* Image Gallery */}
            <div className="mb-9">
              <div className="group relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1628] shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:h-[480px]">
                {images.length > 0 ? (
                  <Image
                    src={images[activeImage]}
                    alt={service.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    sizes="(max-width: 1024px) 100vw, 65vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d1d36] to-[#101c38]">
                    <span className="text-7xl opacity-80">
                      {CATEGORY_ICONS[service.category]}
                    </span>
                  </div>
                )}

                {/* Image overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                    {activeImage + 1} / {images.length}
                  </div>
                )}

                {/* Previous */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-yellow-400/40 hover:bg-yellow-400/15 hover:text-yellow-400"
                      onClick={() =>
                        setActiveImage(
                          (p) => (p - 1 + images.length) % images.length
                        )
                      }
                    >
                      <ChevronLeft size={20} className="cursor-pointer" />
                    </button>

                    {/* Next */}
                    <button
                      type="button"
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-yellow-400/40 hover:bg-yellow-400/15 hover:text-yellow-400"
                      onClick={() =>
                        setActiveImage((p) => (p + 1) % images.length)
                      }
                    >
                      <ChevronRight size={20} className="cursor-pointer" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                        i === activeImage
                          ? "border-yellow-400 ring-2 ring-yellow-400/15"
                          : "border-white/10 opacity-60 hover:border-white/25 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${service.title} ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Info */}
            <div>
              {/* Category + Rating */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-400">
                  <span>{CATEGORY_ICONS[service.category]}</span>
                  {service.category}
                </span>

                {service.rating > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star
                      size={15}
                      fill="currentColor"
                      className="text-yellow-400"
                    />
                    <span className="font-semibold text-yellow-400">
                      {service.rating.toFixed(1)}
                    </span>
                    <span className="text-slate-500">
                      ({service.totalReviews} reviews)
                    </span>
                  </div>
                )}

                {/* Booking mode badge */}
                {service.bookingMode && service.bookingMode !== "date_range" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                    {service.bookingMode === "time_slot" ? (
                      <><Clock size={11} /> Time Slots Available</>
                    ) : (
                      <><CalendarDays size={11} /> Single Day</>
                    )}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                {service.title}
              </h1>

              {/* Location */}
              <div className="mb-6 flex items-start gap-2 text-sm text-slate-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-yellow-400" />
                <span>
                  {service.location.address}, {service.location.city},{" "}
                  {service.location.state}
                </span>
              </div>

              {/* Description */}
              <div className="mb-7">
                <p className="max-w-4xl text-[15px] leading-7 text-slate-300">
                  {service.description}
                </p>
              </div>

              {/* Tags */}
              {service.tags?.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Contact Information */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white">
                    Contact Information
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Get in touch with the service provider
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={`tel:${service.contact.phone}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.05]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                      <Phone size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Phone
                      </p>
                      <p className="truncate text-sm text-slate-300 group-hover:text-white">
                        {service.contact.phone}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${service.contact.email}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.05]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                      <Mail size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Email
                      </p>
                      <p className="truncate text-sm text-slate-300 group-hover:text-white">
                        {service.contact.email}
                      </p>
                    </div>
                  </a>

                  {service.contact.website && (
                    <a
                      href={service.contact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.05] sm:col-span-2"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
                        <Globe size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                          Website
                        </p>
                        <p className="truncate text-sm text-slate-300 group-hover:text-white">
                          {service.contact.website}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
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

                {service.capacity && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Users size={12} />
                    Max capacity: {service.capacity} guests
                  </p>
                )}
              </div>

              {/* Booking Form */}
              <div className="space-y-5 p-6 sm:p-7">

                {/* ── Date(s) ──────────────────────────────────── */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {bookingMode === "date_range" ? "Start Date" : "Event Date"}
                    </label>

                    <DatePicker
                      selected={startDate}
                      onChange={(date: Date | null) => {
                        setStartDate(date);
                        if (endDate && date && date > endDate) {
                          setEndDate(null);
                        }
                      }}
                      minDate={
                        service.availableFrom
                          ? new Date(Math.max(new Date().getTime(), new Date(service.availableFrom).getTime()))
                          : new Date()
                      }
                      maxDate={service.availableTo ? new Date(service.availableTo) : undefined}
                      placeholderText="Select date"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-yellow-400/10"
                      dateFormat="dd MMM yyyy"
                      id="start-date-picker"
                    />
                  </div>

                  {/* End date — only for date_range */}
                  {bookingMode === "date_range" && (
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        End Date
                      </label>

                      <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        minDate={startDate ? startDate : new Date()}
                        maxDate={service.availableTo ? new Date(service.availableTo) : undefined}
                        placeholderText="Select end date"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-yellow-400/10"
                        dateFormat="dd MMM yyyy"
                        id="end-date-picker"
                      />
                    </div>
                  )}
                </div>

                {/* ── Time Slots ────────────────────────────────── */}
                {bookingMode === "time_slot" && startDate && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Select Time Slot
                    </label>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] py-6">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-yellow-400" />
                        <span className="ml-2 text-xs text-slate-500">Loading slots…</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-center text-xs text-slate-500">
                        No time slots available for this date
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlotId(slot._id)}
                            className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 ${
                              !slot.isAvailable
                                ? "cursor-not-allowed border-white/[0.04] bg-white/[0.015] opacity-40"
                                : selectedSlotId === slot._id
                                ? "border-yellow-400/50 bg-yellow-400/[0.08] text-white"
                                : "border-white/[0.07] bg-white/[0.025] text-slate-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock size={14} className={selectedSlotId === slot._id ? "text-yellow-400" : "text-slate-500"} />
                              <div>
                                <p className="text-sm font-medium">{slot.label}</p>
                                <p className="text-xs text-slate-500">
                                  {slot.startTime} – {slot.endTime}
                                  {" · "}
                                  {hoursBetween(slot.startTime, slot.endTime).toFixed(1)} hrs
                                </p>
                              </div>
                            </div>
                            {!slot.isAvailable ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Booked</span>
                            ) : (
                              <span className={`h-4 w-4 rounded-full border-2 transition-all ${selectedSlotId === slot._id ? "border-yellow-400 bg-yellow-400" : "border-white/20"}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Guest Count ───────────────────────────────── */}
                {(pricingUnit === "per_person" || service.capacity) && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Number of Guests
                      {pricingUnit !== "per_person" && (
                        <span className="ml-1 normal-case tracking-normal text-slate-600">(optional)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Users size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="guest-count"
                        type="number"
                        min={1}
                        max={service.capacity}
                        placeholder={service.capacity ? `Max ${service.capacity}` : "e.g. 50"}
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-yellow-400/10"
                      />
                    </div>
                  </div>
                )}

                {/* ── Price Summary ─────────────────────────────── */}
                {totalDays > 0 && (bookingMode !== "time_slot" || selectedSlot) && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between py-1 text-sm text-slate-400">
                      <span>{priceSummaryLine}</span>
                      <span className="text-slate-300">
                        ₹{new Intl.NumberFormat("en-IN").format(totalPrice)}
                      </span>
                    </div>

                    <div className="my-3 h-px bg-white/[0.07]" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        Total
                      </span>

                      <span className="text-lg font-bold text-yellow-400">
                        ₹{new Intl.NumberFormat("en-IN").format(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Notes ────────────────────────────────────── */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Special Requests
                    <span className="ml-1 normal-case tracking-normal text-slate-600">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-yellow-400/10"
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    id="booking-notes"
                  />
                </div>

                {/* ── Book Button ───────────────────────────────── */}
                <button
                  id="book-now-btn"
                  className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(250,204,21,0.12)] transition-all duration-200 hover:bg-yellow-300 hover:shadow-[0_12px_35px_rgba(250,204,21,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  onClick={handleBook}
                  disabled={isBookDisabled}
                >
                  {booking ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CalendarDays size={18} />
                      {isAuthenticated ? "Confirm Booking" : "Sign In to Book"}
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <div className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>You need to be signed in to make a booking</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
