import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit2,
  Trash2,
  MapPin,
  IndianRupee,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Shield,
  Star,
  Info,
  ChevronRight,
} from "lucide-react";
import { Service } from "@/types";
import { formatDate, formatINR } from "@/utils/formatters";
import {
  CATEGORY_MAP,
  BOOKING_MODE_MAP,
  CANCELLATION_BADGE,
  PRICING_UNIT_LABEL,
} from "./constants";

interface ServicesTableProps {
  services: Service[];
  deleting: string | null;
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services,
  deleting,
  expandedIds,
  onToggleExpand,
  onDelete,
  tableContainerRef,
  onScroll,
  canScrollLeft,
  canScrollRight,
}) => {
  return (
    <div className="relative rounded-2xl border border-white/[0.09] bg-[#071329]/70 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      {/* Left Scroll Indicator Shadow */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute bottom-0 left-[340px] top-0 z-30 w-8 bg-gradient-to-r from-[#050d1e]/80 to-transparent transition-opacity" />
      )}

      {/* Right Scroll Indicator Shadow & Glow */}
      {canScrollRight && (
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-30 flex w-12 items-center justify-end pr-2 bg-gradient-to-l from-[#050d1e]/90 to-transparent transition-opacity">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 backdrop-blur-md animate-pulse">
            <ChevronRight size={14} />
          </span>
        </div>
      )}

      {/* Horizontal Scrollable Area */}
      <div
        ref={tableContainerRef as any}
        onScroll={onScroll}
        className="custom-scrollbar overflow-x-auto rounded-2xl pb-3"
      >
        <div className="min-w-[1320px]">
          {/* Table Header Row */}
          <div className="grid grid-cols-[340px_160px_160px_200px_170px_140px_150px] items-center border-b border-white/[0.08] bg-[#061125] text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {/* Sticky Header Column 1 */}
            <div className="sticky left-0 z-20 flex items-center gap-2 border-r border-white/10 bg-[#061125] py-4 pl-6 pr-4 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
              <span>Service Details & Media</span>
            </div>

            <div className="px-4 py-4">Category & Model</div>
            <div className="px-4 py-4">Pricing & Policy</div>
            <div className="px-4 py-4">Location & Contact</div>
            <div className="px-4 py-4">Operating Window</div>
            <div className="px-4 py-4">Rating & Status</div>
            <div className="py-4 pl-4 pr-6 text-right">Actions</div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-white/[0.06]">
            {services.map((svc) => {
              const isExpanded = !!expandedIds[svc._id];
              const catInfo = CATEGORY_MAP[svc.category] || CATEGORY_MAP.other;
              const modeInfo =
                BOOKING_MODE_MAP[svc.bookingMode || "date_range"] ||
                BOOKING_MODE_MAP.date_range;
              const cancelPolicy =
                CANCELLATION_BADGE[svc.cancellationPolicy || "Flexible"] ||
                CANCELLATION_BADGE.Flexible;
              const primaryImage = svc.images?.[0];
              const unitLabel =
                PRICING_UNIT_LABEL[svc.pricingUnit || "per_day"] || "per day";

              return (
                <div
                  key={svc._id}
                  id={`admin-service-${svc._id}`}
                  className="group transition-colors duration-150 hover:bg-white/[0.03]"
                >
                  {/* Main Grid Row */}
                  <div className="grid grid-cols-[340px_160px_160px_200px_170px_140px_150px] items-center">
                    {/* STICKY COLUMN 1: Service Details & Media */}
                    <div className="sticky left-0 z-10 flex min-w-0 items-start gap-3.5 border-r border-white/10 bg-[#061125] py-4 pl-6 pr-4 shadow-[4px_0_12px_rgba(0,0,0,0.35)] transition-colors group-hover:bg-[#0a1a38]">
                      {/* Thumbnail with photo count badge */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-md">
                        {primaryImage ? (
                          <Image
                            src={primaryImage}
                            alt={svc.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-2xl">
                            {catInfo.icon}
                          </div>
                        )}
                        {svc.images && svc.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                            📷 {svc.images.length}
                          </span>
                        )}
                      </div>

                      {/* Title, tags, description */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/services/${svc._id}`}
                          className="block truncate text-[14px] font-bold text-white transition-colors hover:text-yellow-400"
                          title={svc.title}
                        >
                          {svc.title}
                        </Link>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                          {svc.description}
                        </p>

                        {/* Tags & Amenities pills */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {svc.tags?.slice(0, 2).map((t, i) => (
                            <span
                              key={i}
                              className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                            >
                              #{t}
                            </span>
                          ))}
                          {svc.amenities && svc.amenities.length > 0 && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                              {svc.amenities[0]}
                              {svc.amenities.length > 1
                                ? ` +${svc.amenities.length - 1}`
                                : ""}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {formatDate(svc.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: Category & Booking Model */}
                    <div className="space-y-1.5 px-4 py-4">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${catInfo.badgeClass}`}
                        >
                          <span>{catInfo.icon}</span>
                          {catInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${modeInfo.badgeClass}`}
                        >
                          <span>{modeInfo.icon}</span>
                          {modeInfo.label}
                        </span>

                        {svc.bookingMode === "time_slot" && (
                          <span className="text-[11px] text-purple-300/80">
                            ⚡ {svc.timeSlots?.length || 0} slots
                          </span>
                        )}

                        {svc.capacity && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Users size={11} className="text-slate-500" />
                            Cap: {svc.capacity} guests
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COLUMN 3: Pricing & Policy */}
                    <div className="space-y-1.5 px-4 py-4">
                      <div>
                        <div className="flex items-center gap-0.5 text-base font-black text-yellow-400">
                          <IndianRupee size={15} />
                          <span>{formatINR(svc.pricePerDay)}</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          / {unitLabel}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cancelPolicy.badgeClass}`}
                        >
                          <Shield size={10} />
                          {cancelPolicy.label}
                        </span>
                      </div>
                    </div>

                    {/* COLUMN 4: Location & Contact */}
                    <div className="space-y-1 px-4 py-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <MapPin
                          size={13}
                          className="shrink-0 text-yellow-400"
                        />
                        <span className="truncate">
                          {svc.location.city}
                          {svc.location.state ? `, ${svc.location.state}` : ""}
                        </span>
                      </div>

                      {svc.location.address && (
                        <p className="line-clamp-1 text-[11px] text-slate-400">
                          {svc.location.address}
                        </p>
                      )}

                      {/* Quick Contact shortcuts */}
                      <div className="flex items-center gap-2 pt-1 text-slate-400">
                        {svc.contact?.phone && (
                          <a
                            href={`tel:${svc.contact.phone}`}
                            className="transition-colors hover:text-white"
                            title={`Call ${svc.contact.phone}`}
                          >
                            <Phone size={12} />
                          </a>
                        )}
                        {svc.contact?.email && (
                          <a
                            href={`mailto:${svc.contact.email}`}
                            className="transition-colors hover:text-white"
                            title={`Email ${svc.contact.email}`}
                          >
                            <Mail size={12} />
                          </a>
                        )}
                        {svc.contact?.website && (
                          <a
                            href={svc.contact.website}
                            target="_blank"
                            rel="noreferrer"
                            className="transition-colors hover:text-white"
                            title="Visit Website"
                          >
                            <Globe size={12} />
                          </a>
                        )}
                        <span className="truncate text-[10px] text-slate-500 max-w-[130px]">
                          {svc.contact?.phone ||
                            svc.contact?.email ||
                            "No contact"}
                        </span>
                      </div>
                    </div>

                    {/* COLUMN 5: Operating Window */}
                    <div className="space-y-1 px-4 py-4 text-xs">
                      {svc.availableFrom || svc.availableTo ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                            <Calendar
                              size={12}
                              className="text-slate-400"
                            />
                            <span>
                              {formatDate(svc.availableFrom) || "Start"}
                            </span>
                          </div>
                          <div className="pl-4 text-[11px] text-slate-400">
                            to {formatDate(svc.availableTo) || "Ongoing"}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <Sparkles size={11} /> Always Available
                        </span>
                      )}

                      {svc.availability && svc.availability.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                          {svc.availability.filter((a) => a.isBooked).length}{" "}
                          booked blocks
                        </div>
                      )}
                    </div>

                    {/* COLUMN 6: Rating & Status */}
                    <div className="space-y-1.5 px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 rounded-md border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-xs font-bold text-yellow-400">
                          <Star size={12} className="fill-yellow-400" />
                          <span>
                            {svc.rating ? svc.rating.toFixed(1) : "5.0"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          ({svc.totalReviews || 0})
                        </span>
                      </div>

                      <div>
                        {svc.isActive === false ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/25 bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        ) : svc.availableTo && new Date(svc.availableTo).setHours(23, 59, 59, 999) < Date.now() ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                            title="Expired: hidden from users because availableTo date has passed"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COLUMN 7: Actions */}
                    <div className="flex items-center justify-end gap-1.5 py-4 pl-4 pr-6">
                      {/* View Live */}
                      <Link
                        href={`/services/${svc._id}`}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-300"
                        title="View public page"
                      >
                        <ExternalLink size={13} />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/admin/services/${svc._id}/edit`}
                        id={`edit-service-${svc._id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300"
                        title="Edit service"
                      >
                        <Edit2 size={13} />
                      </Link>

                      {/* Delete */}
                      <button
                        id={`delete-service-${svc._id}`}
                        type="button"
                        onClick={() => onDelete(svc._id, svc.title)}
                        disabled={deleting === svc._id}
                        className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-lg border border-red-400/15 bg-red-400/[0.06] text-red-400 transition-all hover:border-red-400/30 hover:bg-red-400/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete service"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Expand toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleExpand(svc._id)}
                        className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all ${
                          isExpanded
                            ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-400"
                            : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                        }`}
                        title="Expand full details"
                      >
                        {isExpanded ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDABLE DEEP DIVE ACCORDION */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.08] bg-black/30 p-6 backdrop-blur-md">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left: Complete Description & Amenities */}
                        <div className="space-y-4 lg:col-span-2">
                          <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-400">
                              <Info size={13} /> Full Description
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">
                              {svc.description}
                            </p>
                          </div>

                          {/* Amenities List */}
                          {svc.amenities && svc.amenities.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Included Amenities ({svc.amenities.length})
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {svc.amenities.map((amenity, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200"
                                  >
                                    <CheckCircle2
                                      size={12}
                                      className="text-emerald-400"
                                    />
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Time Slots Preview */}
                          {svc.timeSlots && svc.timeSlots.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                                <Clock size={13} /> Configured Time Slots ({svc.timeSlots.length})
                              </h4>
                              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {svc.timeSlots.map((slot) => (
                                  <div
                                    key={slot._id}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs"
                                  >
                                    <div>
                                      <span className="font-semibold text-white">
                                        {slot.label}
                                      </span>
                                      <div className="text-[11px] text-slate-400">
                                        {slot.startTime} – {slot.endTime}
                                      </div>
                                    </div>
                                    <span className="rounded bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                      Max {slot.maxBookings} bookings
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Photo Gallery Strip */}
                          {svc.images && svc.images.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Service Gallery ({svc.images.length} images)
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-3">
                                {svc.images.map((imgUrl, i) => (
                                  <div
                                    key={i}
                                    className="relative h-20 w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-900"
                                  >
                                    <Image
                                      src={imgUrl}
                                      alt={`${svc.title} preview ${i + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="112px"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Contact & Quick Metadata Card */}
                        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs">
                          <h4 className="font-bold uppercase tracking-wider text-slate-300">
                            Contact & Location Details
                          </h4>

                          <div className="space-y-2 text-slate-300">
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={14}
                                className="mt-0.5 shrink-0 text-yellow-400"
                              />
                              <div>
                                <div className="font-semibold text-white">
                                  {svc.location.city}, {svc.location.state}
                                </div>
                                <div className="text-slate-400">
                                  {svc.location.address || "Address not specified"}
                                </div>
                              </div>
                            </div>

                            {svc.contact?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={13} className="text-slate-400" />
                                <span>{svc.contact.phone}</span>
                              </div>
                            )}

                            {svc.contact?.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={13} className="text-slate-400" />
                                <span>{svc.contact.email}</span>
                              </div>
                            )}

                            {svc.contact?.website && (
                              <div className="flex items-center gap-2">
                                <Globe size={13} className="text-slate-400" />
                                <a
                                  href={svc.contact.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 underline hover:text-blue-300"
                                >
                                  {svc.contact.website}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
                            <div>
                              ID: <span className="font-mono text-slate-300">{svc._id}</span>
                            </div>
                            <div>
                              Cancellation Policy:{" "}
                              <span className="font-semibold text-white">
                                {svc.cancellationPolicy || "Flexible"}
                              </span>
                            </div>
                            {typeof svc.createdBy === "object" && svc.createdBy?.name && (
                              <div>
                                Created by: <span className="text-white">{svc.createdBy.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <Link
                              href={`/admin/services/${svc._id}/edit`}
                              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 text-xs font-bold text-[#050d1e] transition-all hover:bg-yellow-300"
                            >
                              <Edit2 size={13} />
                              Edit Full Service
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesTable;
