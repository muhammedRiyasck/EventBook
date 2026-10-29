import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IndianRupee,
  Star,
  Shield,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
} from "lucide-react";
import { Service } from "@/types";
import { formatINR } from "@/utils/formatters";
import {
  CATEGORY_MAP,
  BOOKING_MODE_MAP,
  CANCELLATION_BADGE,
  PRICING_UNIT_LABEL,
} from "./constants";

interface ServicesGridProps {
  services: Service[];
  deleting: string | null;
  onDelete: (id: string, title: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({
  services,
  deleting,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((svc) => {
        const catInfo = CATEGORY_MAP[svc.category] || CATEGORY_MAP.other;
        const modeInfo =
          BOOKING_MODE_MAP[svc.bookingMode || "date_range"] ||
          BOOKING_MODE_MAP.date_range;
        const cancelPolicy =
          CANCELLATION_BADGE[svc.cancellationPolicy || "Flexible"] ||
          CANCELLATION_BADGE.Flexible;
        const primaryImage = svc.images?.[0];

        return (
          <div
            key={svc._id}
            id={`admin-service-${svc._id}`}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-200 hover:border-yellow-400/25 hover:bg-white/[0.05] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
          >
            <div>
              {/* Media Header */}
              <div className="relative h-48 w-full bg-slate-900">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={svc.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {catInfo.icon}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${catInfo.badgeClass}`}
                  >
                    {catInfo.icon} {catInfo.label}
                  </span>
                </div>

                <div className="absolute right-3 top-3">
                  {svc.isActive === false ? (
                    <span className="rounded-full border border-slate-400/30 bg-slate-500/20 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 backdrop-blur-md">
                      Inactive
                    </span>
                  ) : svc.availableTo && new Date(svc.availableTo).setHours(23, 59, 59, 999) < Date.now() ? (
                    <span
                      className="rounded-full border border-amber-400/30 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md"
                      title="Expired: hidden from users because availableTo date has passed"
                    >
                      Expired
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                      Active
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-0.5 text-xl font-black text-yellow-400">
                      <IndianRupee size={18} />
                      {formatINR(svc.pricePerDay)}
                    </div>
                    <span className="text-[11px] font-medium text-slate-300">
                      / {PRICING_UNIT_LABEL[svc.pricingUnit || "per_day"] || "per day"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-yellow-400 backdrop-blur-sm">
                    <Star size={12} className="fill-yellow-400" />
                    <span>
                      {svc.rating ? svc.rating.toFixed(1) : "5.0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <h3 className="line-clamp-1 text-lg font-bold text-white transition-colors group-hover:text-yellow-400">
                  {svc.title}
                </h3>

                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {svc.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${modeInfo.badgeClass}`}
                  >
                    {modeInfo.icon} {modeInfo.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cancelPolicy.badgeClass}`}
                  >
                    <Shield size={10} />
                    {cancelPolicy.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-300">
                  <MapPin size={13} className="shrink-0 text-yellow-400" />
                  <span className="truncate">
                    {svc.location.city}
                    {svc.location.state ? `, ${svc.location.state}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-5 py-3.5">
              <Link
                href={`/services/${svc._id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                <ExternalLink size={13} />
                Live View
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/services/${svc._id}/edit`}
                  id={`edit-service-${svc._id}`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Edit2 size={12} />
                  Edit
                </Link>

                <button
                  id={`delete-service-${svc._id}`}
                  type="button"
                  onClick={() => onDelete(svc._id, svc.title)}
                  disabled={deleting === svc._id}
                  className="inline-flex h-8 items-center cursor-pointer gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-400/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ServicesGrid;
