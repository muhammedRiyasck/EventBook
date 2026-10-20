import React from "react";
import { Clock, Plus, X } from "lucide-react";
import { SlotItem } from "./types";

interface AvailabilitySectionProps {
  bookingMode: string;
  onBookingModeChange: (mode: string) => void;
  showSlotBuilder: boolean;
  setShowSlotBuilder: (show: boolean) => void;
  maxBookingsPerDay: string;
  onMaxBookingsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  timeSlots: SlotItem[];
  newSlot: {
    label: string;
    startTime: string;
    endTime: string;
    maxBookings: number;
  };
  setNewSlot: React.Dispatch<
    React.SetStateAction<{
      label: string;
      startTime: string;
      endTime: string;
      maxBookings: number;
    }>
  >;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
}

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  bookingMode,
  onBookingModeChange,
  showSlotBuilder,
  setShowSlotBuilder,
  maxBookingsPerDay,
  onMaxBookingsChange,
  timeSlots,
  newSlot,
  setNewSlot,
  onAddSlot,
  onRemoveSlot,
}) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">
          Booking Mode &amp; Time Slots
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Choose how customers book this service.
        </p>
      </div>

      {/* Booking Mode Selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            {
              value: "date_range",
              label: "📅 Date Range",
              desc: "Multi-day booking (venue, hotel)",
            },
            {
              value: "single_day",
              label: "📆 Single Day",
              desc: "One specific day (decorator, caterer)",
            },
            {
              value: "time_slot",
              label: "🕐 Time Slots",
              desc: "Specific sessions per day (DJ, cameraman)",
            },
          ] as { value: string; label: string; desc: string }[]
        ).map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => {
              onBookingModeChange(mode.value);
              setShowSlotBuilder(mode.value === "time_slot");
            }}
            className={`flex flex-col gap-1 cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
              (showSlotBuilder ? "time_slot" : bookingMode) === mode.value
                ? "border-yellow-400/50 bg-yellow-400/[0.07] text-white"
                : "border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
            }`}
          >
            <span className="text-sm font-semibold">{mode.label}</span>
            <span className="text-xs text-slate-500">{mode.desc}</span>
          </button>
        ))}
      </div>

      {/* Max Bookings Per Day (non-time-slot modes) */}
      {!showSlotBuilder && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Max Bookings Per Day{" "}
            <span className="text-slate-600">(optional)</span>
          </label>
          <input
            name="maxBookingsPerDay"
            type="number"
            min={1}
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="e.g. 1 (leave empty for unlimited)"
            value={maxBookingsPerDay}
            onChange={onMaxBookingsChange}
          />
        </div>
      )}

      {/* Time Slot Builder */}
      {showSlotBuilder && (
        <div className="flex flex-col gap-4">
          {/* Existing Slots */}
          {timeSlots.length > 0 && (
            <div className="flex flex-col gap-2">
              {timeSlots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                >
                  <Clock size={14} className="shrink-0 text-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {slot.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {slot.startTime} – {slot.endTime} · max {slot.maxBookings}{" "}
                      booking{slot.maxBookings > 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(i)}
                    className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Slot */}
          <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.015] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Add a Time Slot
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Slot label (e.g. Morning Show, Evening Session)"
                  value={newSlot.label}
                  onChange={(e) =>
                    setNewSlot((p) => ({ ...p, label: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) =>
                    setNewSlot((p) => ({ ...p, startTime: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  End Time
                </label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) =>
                    setNewSlot((p) => ({ ...p, endTime: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Max Bookings per Slot
                </label>
                <input
                  type="number"
                  min={1}
                  value={newSlot.maxBookings}
                  onChange={(e) =>
                    setNewSlot((p) => ({
                      ...p,
                      maxBookings: Number(e.target.value),
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onAddSlot}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-400/20"
                >
                  <Plus size={14} /> Add Slot
                </button>
              </div>
            </div>
          </div>

          {timeSlots.length === 0 && (
            <p className="text-center text-xs text-slate-600">
              No slots yet. Add at least one slot above.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
