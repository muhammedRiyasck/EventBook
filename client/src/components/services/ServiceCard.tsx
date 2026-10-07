"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, IndianRupee, Calendar } from "lucide-react";
import { Service } from "@/types";

interface Props {
  service: Service;
}

const CATEGORY_ICONS: Record<string, string> = {
  venue: "🏛️",
  hotel: "🏨",
  caterer: "🍽️",
  cameraman: "📷",
  dj: "🎧",
  decorator: "🌸",
  other: "✨",
};

export default function ServiceCard({ service }: Props) {
  const formattedPrice = new Intl.NumberFormat("en-IN").format(
    service.pricePerDay,
  );
  const categoryIcon = CATEGORY_ICONS[service.category] || "✨";
  const mainImage = service.images?.[0];

  return (
    <Link
      href={`/services/${service._id}`}
      id={`service-card-${service._id}`}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-yellow-400/25 hover:bg-white/[0.05] hover:shadow-[0_18px_45px_rgba(0,0,0,0.3),0_0_25px_rgba(250,204,21,0.06)]"
    >
      {/* Image */}
      <div className="relative h-[210px] w-full shrink-0 overflow-hidden bg-slate-900">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-800">
            <span className="text-[52px] opacity-50">{categoryIcon}</span>
          </div>
        )}

        {/* Image Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Category */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#050d1e]/75 px-2.5 py-1.5 text-[11px] font-semibold capitalize text-white shadow-lg backdrop-blur-md">
            <span>{categoryIcon}</span>
            {service.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-4.5 p-5">
        {/* Title */}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-tight text-white transition-colors duration-200 group-hover:text-yellow-300">
          {service.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin size={13} className="shrink-0 text-slate-500" />
          <span className="truncate">
            {service.location.city}, {service.location.state}
          </span>
        </div>

        {/* Description */}
        <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-slate-400">
          {service.description.length > 100
            ? service.description.slice(0, 100) + "…"
            : service.description}
        </p>

        {/* Price / Rating */}
        <div className="mt-1 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div className="flex items-baseline gap-0.5 text-yellow-400">
            <IndianRupee size={14} />
            <span className="text-[18px] font-extrabold tracking-tight">
              {formattedPrice}
            </span>
            <span className="ml-0.5 text-xs font-medium text-slate-500">
              /day
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
            <Star size={13} fill="currentColor" />
            <span>
              {service.rating > 0 ? service.rating.toFixed(1) : "New"}
            </span>
          </div>
        </div>

        {/* Availability */}
        {service.availability?.some((a) => !a.isBooked) && (
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <Calendar size={12} />
            <span>Available for booking</span>
          </div>
        )}
      </div>
    </Link>
  );
}
