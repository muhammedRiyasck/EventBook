import { ServiceCategory, BookingMode } from "@/types";

export const CATEGORY_MAP: Record<
  ServiceCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  venue: {
    label: "Venue",
    icon: "🏛️",
    badgeClass: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  },
  hotel: {
    label: "Hotel",
    icon: "🏨",
    badgeClass: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  },
  caterer: {
    label: "Caterer",
    icon: "🍽️",
    badgeClass: "bg-orange-400/10 text-orange-300 border-orange-400/25",
  },
  cameraman: {
    label: "Cameraman",
    icon: "📷",
    badgeClass: "bg-purple-400/10 text-purple-300 border-purple-400/25",
  },
  dj: {
    label: "DJ & Music",
    icon: "🎧",
    badgeClass: "bg-pink-400/10 text-pink-300 border-pink-400/25",
  },
  decorator: {
    label: "Decorator",
    icon: "🌸",
    badgeClass: "bg-rose-400/10 text-rose-300 border-rose-400/25",
  },
  other: {
    label: "Other",
    icon: "✨",
    badgeClass: "bg-cyan-400/10 text-cyan-300 border-cyan-400/25",
  },
};

export const BOOKING_MODE_MAP: Record<
  BookingMode,
  { label: string; badgeClass: string; icon: string }
> = {
  date_range: {
    label: "Date Range",
    badgeClass: "bg-blue-400/10 text-blue-300 border-blue-400/25",
    icon: "📅",
  },
  single_day: {
    label: "Single Day",
    badgeClass: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
    icon: "☀️",
  },
  time_slot: {
    label: "Time Slots",
    badgeClass: "bg-violet-400/10 text-violet-300 border-violet-400/25",
    icon: "⏰",
  },
};

export const CANCELLATION_BADGE: Record<
  string,
  { label: string; badgeClass: string }
> = {
  Flexible: {
    label: "Flexible",
    badgeClass: "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
  },
  Moderate: {
    label: "Moderate",
    badgeClass: "bg-amber-400/10 text-amber-400 border-amber-400/25",
  },
  Strict: {
    label: "Strict",
    badgeClass: "bg-rose-400/10 text-rose-400 border-rose-400/25",
  },
};

export const PRICING_UNIT_LABEL: Record<string, string> = {
  per_day: "per day",
  per_hour: "per hr",
  per_person: "per guest",
  per_project: "per event",
};
