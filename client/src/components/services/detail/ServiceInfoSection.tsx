import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  IndianRupee,
  CalendarDays,
  Clock,
  Users,
  Shield,
  Wifi,
  CheckCircle2,
  CalendarRange,
  Info,
  Layers,
} from "lucide-react";
import { Service } from "@/types";
import {
  CATEGORY_ICONS,
  CANCELLATION_COLOR,
  CANCELLATION_DESC,
  fmtDate,
} from "./types";

interface ServiceInfoSectionProps {
  service: Service;
  formattedPrice: string;
  pricingUnitLabel: string;
}

export const ServiceInfoSection: React.FC<ServiceInfoSectionProps> = ({
  service,
  formattedPrice,
  pricingUnitLabel,
}) => {
  const cancelStyle = service.cancellationPolicy
    ? CANCELLATION_COLOR[service.cancellationPolicy]
    : null;
  const bookingMode = service.bookingMode ?? "date_range";

  return (
    <div>
      {/* Category + Rating + Badges */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-400">
          <span>{CATEGORY_ICONS[service.category]}</span>
          {service.category === "other" && service.customCategory
            ? service.customCategory
            : service.category}
        </span>

        {service.rating > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Star size={15} fill="currentColor" className="text-yellow-400" />
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
              <>
                <Clock size={11} /> Time Slots Available
              </>
            ) : (
              <>
                <CalendarDays size={11} /> Single Day
              </>
            )}
          </span>
        )}

        {/* Cancellation policy badge */}
        {service.cancellationPolicy && cancelStyle && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${cancelStyle.border} ${cancelStyle.bg} ${cancelStyle.text}`}
          >
            <Shield size={11} />
            {service.cancellationPolicy}
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

      {/* ── Key Details Grid ────────────────────────────────────── */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pricing unit */}
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
            <IndianRupee size={16} />
          </div>
          <div>
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pricing
            </p>
            <p className="text-sm font-semibold text-white">
              ₹{formattedPrice}{" "}
              <span className="font-normal text-slate-400">
                {pricingUnitLabel}
              </span>
            </p>
          </div>
        </div>

        {/* Capacity */}
        {service.capacity && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-400">
              <Users size={16} />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Capacity
              </p>
              <p className="text-sm font-semibold text-white">
                {service.capacity}{" "}
                <span className="font-normal text-slate-400">guests max</span>
              </p>
            </div>
          </div>
        )}

        {/* Max bookings per day */}
        {service.maxBookingsPerDay && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-400/10 text-purple-400">
              <Layers size={16} />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Bookings/Day
              </p>
              <p className="text-sm font-semibold text-white">
                {service.maxBookingsPerDay}{" "}
                <span className="font-normal text-slate-400">max bookings</span>
              </p>
            </div>
          </div>
        )}

        {/* Available From */}
        {service.availableFrom && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <CalendarRange size={16} />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Available From
              </p>
              <p className="text-sm font-semibold text-white">
                {fmtDate(service.availableFrom)}
              </p>
            </div>
          </div>
        )}

        {/* Available To */}
        {service.availableTo && (
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-400/10 text-red-400">
              <CalendarRange size={16} />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Available Until
              </p>
              <p className="text-sm font-semibold text-white">
                {fmtDate(service.availableTo)}
              </p>
            </div>
          </div>
        )}

        {/* Booking mode */}
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400">
            <Info size={16} />
          </div>
          <div>
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Booking Type
            </p>
            <p className="text-sm font-semibold capitalize text-white">
              {bookingMode.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Amenities ──────────────────────────────────────────────── */}
      {service.amenities && service.amenities.length > 0 && (
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wifi size={16} className="text-yellow-400" />
            <h3 className="text-base font-bold text-white">
              Amenities &amp; Features
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {service.amenities.map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
              >
                <CheckCircle2
                  size={14}
                  className="shrink-0 text-emerald-400"
                />
                <span className="text-sm text-slate-300">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cancellation Policy ─────────────────────────────────── */}
      {service.cancellationPolicy && cancelStyle && (
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={16} className="text-yellow-400" />
            <h3 className="text-base font-bold text-white">
              Cancellation Policy
            </h3>
          </div>
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${cancelStyle.border} ${cancelStyle.bg}`}
          >
            <div
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                service.cancellationPolicy === "Flexible"
                  ? "bg-emerald-400"
                  : service.cancellationPolicy === "Moderate"
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
            <div>
              <p className={`text-sm font-semibold ${cancelStyle.text}`}>
                {service.cancellationPolicy}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {CANCELLATION_DESC[service.cancellationPolicy]}
              </p>
            </div>
          </div>
        </div>
      )}

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
  );
};
