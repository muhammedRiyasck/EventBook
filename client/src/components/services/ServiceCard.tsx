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
      className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-pointer animate-[fadeInUp_0.4s_ease_forwards] group hover:-translate-y-1.5 hover:border-[var(--gold-400)]/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(255,215,0,0.1)]"
      id={`service-card-${service._id}`}
    >
      {/* Image */}
      <div className="relative w-full h-[200px] bg-slate-800 overflow-hidden shrink-0">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700">
            <span className="text-[52px] opacity-60">{categoryIcon}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge badge-${service.category}`}>
            {categoryIcon} {service.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2">
          {service.title}
        </h3>

        <div className="flex items-center gap-1 text-[12px] text-slate-400">
          <MapPin size={13} />
          <span>
            {service.location.city}, {service.location.state}
          </span>
        </div>

        <p className="text-[13px] text-slate-400 leading-relaxed flex-1">
          {service.description.length > 100
            ? service.description.slice(0, 100) + "…"
            : service.description}
        </p>

        <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
          <div className="flex items-center gap-0.5 text-[var(--gold-400)]">
            <IndianRupee size={14} />
            <span className="text-[18px] font-extrabold font-display">
              {formattedPrice}
            </span>
            <span className="text-[12px] text-slate-400 ml-0.5">/day</span>
          </div>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-[var(--gold-400)]">
            <Star size={13} fill="currentColor" />
            <span>
              {service.rating > 0 ? service.rating.toFixed(1) : "New"}
            </span>
          </div>
        </div>

        {service.availability?.some((a) => !a.isBooked) && (
          <div className="flex items-center gap-1.5 text-[11px] text-green-500 py-1 px-2 bg-green-500/10 rounded-full w-fit">
            <Calendar size={12} />
            <span>Available for booking</span>
          </div>
        )}
      </div>
    </Link>
  );
}
