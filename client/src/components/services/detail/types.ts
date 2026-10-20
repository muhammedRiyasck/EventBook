export interface AvailableSlot {
  _id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  bookedCount: number;
  isAvailable: boolean;
}

export const CATEGORY_ICONS: Record<string, string> = {
  venue: "🏛️",
  hotel: "🏨",
  caterer: "🍽️",
  cameraman: "📷",
  dj: "🎧",
  decorator: "🌸",
  other: "✨",
};

export const CANCELLATION_COLOR: Record<
  string,
  { text: string; border: string; bg: string }
> = {
  Flexible: {
    text: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/10",
  },
  Moderate: {
    text: "text-yellow-400",
    border: "border-yellow-400/20",
    bg: "bg-yellow-400/10",
  },
  Strict: {
    text: "text-red-400",
    border: "border-red-400/20",
    bg: "bg-red-400/10",
  },
};

export const CANCELLATION_DESC: Record<string, string> = {
  Flexible: "Free cancellation anytime before the event date.",
  Moderate: "Free cancellation up to 7 days before; 50% refund within 7 days.",
  Strict: "Non-refundable after booking confirmation.",
};

export const hoursBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
};

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
