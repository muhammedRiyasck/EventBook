import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Clock,
  Users,
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Service } from "@/types";
import { AvailableSlot, hoursBetween } from "./types";

interface CustomerBookingFormProps {
  service: Service;
  bookingMode: string;
  pricingUnit: string;
  pricingUnitLabel: string;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  availableSlots: AvailableSlot[];
  selectedSlotId: string;
  setSelectedSlotId: (id: string) => void;
  loadingSlots: boolean;
  guestCount: string;
  setGuestCount: (val: string) => void;
  dailyStats: { bookings: number; guests: number } | null;
  notes: string;
  setNotes: (val: string) => void;
  totalDays: number;
  selectedSlot?: AvailableSlot;
  totalHours: number;
  totalPrice: number;
  priceSummaryLine: string;
  booking: boolean;
  isBookDisabled: boolean;
  isAuthenticated: boolean;
  onBook: () => void;
}

export const CustomerBookingForm: React.FC<CustomerBookingFormProps> = ({
  service,
  bookingMode,
  pricingUnit,
  pricingUnitLabel,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  availableSlots,
  selectedSlotId,
  setSelectedSlotId,
  loadingSlots,
  guestCount,
  setGuestCount,
  dailyStats,
  notes,
  setNotes,
  totalDays,
  selectedSlot,
  totalHours,
  totalPrice,
  priceSummaryLine,
  booking,
  isBookDisabled,
  isAuthenticated,
  onBook,
}) => {
  const [slotPage, setSlotPage] = useState(1);
  const SLOTS_PER_PAGE = 4;

  useEffect(() => {
    setSlotPage(1);
  }, [availableSlots]);

  const totalSlotPages = Math.max(
    1,
    Math.ceil(availableSlots.length / SLOTS_PER_PAGE)
  );
  const paginatedSlots = availableSlots.slice(
    (slotPage - 1) * SLOTS_PER_PAGE,
    slotPage * SLOTS_PER_PAGE
  );

  return (
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
                ? new Date(
                    Math.max(
                      new Date().getTime(),
                      new Date(service.availableFrom).getTime()
                    )
                  )
                : new Date()
            }
            maxDate={
              service.availableTo ? new Date(service.availableTo) : undefined
            }
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
              maxDate={
                service.availableTo ? new Date(service.availableTo) : undefined
              }
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
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Time Slot
            </label>
            {availableSlots.length > SLOTS_PER_PAGE && (
              <span className="text-[11px] text-slate-400">
                {(slotPage - 1) * SLOTS_PER_PAGE + 1}–
                {Math.min(slotPage * SLOTS_PER_PAGE, availableSlots.length)} of{" "}
                {availableSlots.length} slots
              </span>
            )}
          </div>

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
            <>
              <div className="flex flex-col gap-2">
                {paginatedSlots.map((slot) => (
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
                      <Clock
                        size={14}
                        className={
                          selectedSlotId === slot._id
                            ? "text-yellow-400"
                            : "text-slate-500"
                        }
                      />
                      <div>
                        <p className="text-sm font-medium">{slot.label}</p>
                        <p className="text-xs text-slate-500">
                          {slot.startTime} – {slot.endTime}
                          {" · "}
                          {hoursBetween(slot.startTime, slot.endTime).toFixed(1)} hrs
                          {slot.maxBookings > 0 && (
                            <>
                              {" · "}
                              <span
                                className={
                                  slot.isAvailable
                                    ? "text-emerald-400/80"
                                    : "text-red-400/80"
                                }
                              >
                                {Math.max(0, slot.maxBookings - slot.bookedCount)}{" "}
                                left
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {!slot.isAvailable ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                        Full
                      </span>
                    ) : (
                      <span
                        className={`h-4 w-4 rounded-full border-2 transition-all ${
                          selectedSlotId === slot._id
                            ? "border-yellow-400 bg-yellow-400"
                            : "border-white/20"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {totalSlotPages > 1 && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400">
                  <button
                    type="button"
                    disabled={slotPage <= 1}
                    onClick={() => setSlotPage((p) => Math.max(1, p - 1))}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={13} />
                    Prev
                  </button>
                  <span className="font-medium text-slate-300">
                    Batch {slotPage} of {totalSlotPages}
                  </span>
                  <button
                    type="button"
                    disabled={slotPage >= totalSlotPages}
                    onClick={() =>
                      setSlotPage((p) => Math.min(totalSlotPages, p + 1))
                    }
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Guest Count ───────────────────────────────── */}
      {(pricingUnit === "per_person" || service.capacity) && (
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>
              Number of Guests
              {pricingUnit !== "per_person" && (
                <span className="ml-1 normal-case tracking-normal text-slate-600">
                  (optional)
                </span>
              )}
            </span>
            {service.capacity && dailyStats && (
              <span
                className={
                  service.capacity - dailyStats.guests > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {Math.max(0, service.capacity - dailyStats.guests)} spots left
                today
              </span>
            )}
          </label>
          <div className="relative">
            <Users
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="guest-count"
              type="number"
              min={1}
              max={service.capacity}
              placeholder={
                service.capacity ? `Max ${service.capacity}` : "e.g. 50"
              }
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-yellow-400/10"
            />
          </div>
          {pricingUnit !== "per_person" && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              This service is priced {pricingUnitLabel}, not per guest.
            </p>
          )}
        </div>
      )}

      {/* ── Price Summary ─────────────────────────────── */}
      {totalDays > 0 && (bookingMode !== "time_slot" || selectedSlot) && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{priceSummaryLine}</span>
              <span className="text-slate-300">
                ₹{new Intl.NumberFormat("en-IN").format(totalPrice)}
              </span>
            </div>

            {/* Time slot detail */}
            {bookingMode === "time_slot" && selectedSlot && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {selectedSlot.label} ({selectedSlot.startTime} –{" "}
                  {selectedSlot.endTime})
                </span>
                <span>{totalHours.toFixed(1)} hrs</span>
              </div>
            )}

            {/* Guest count detail */}
            {guestCount && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users size={11} /> Guests
                </span>
                <span>{guestCount}</span>
              </div>
            )}

            {/* Date range duration */}
            {bookingMode === "date_range" && startDate && endDate && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays size={11} /> Duration
                </span>
                <span>
                  {totalDays} day{totalDays !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="my-3 h-px bg-white/[0.07]" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="text-lg font-bold text-yellow-400">
              ₹{new Intl.NumberFormat("en-IN").format(totalPrice)}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-slate-600">
            * Payment collected offline. Booking is confirmed immediately.
          </p>
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

      {service.maxBookingsPerDay &&
        dailyStats &&
        dailyStats.bookings >= service.maxBookingsPerDay && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-center text-xs text-red-400">
            This service is fully booked for the selected date.
          </div>
        )}

      {/* ── Book Button ───────────────────────────────── */}
      <button
        id="book-now-btn"
        className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(250,204,21,0.12)] transition-all duration-200 hover:bg-yellow-300 hover:shadow-[0_12px_35px_rgba(250,204,21,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        onClick={onBook}
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
  );
};
