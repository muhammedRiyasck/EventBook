import React from "react";
import { IndianRupee } from "lucide-react";
import { ServiceFormData } from "./types";

interface PricingSectionProps {
  form: ServiceFormData;
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  form,
  errors,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">Pricing & Schedule</h3>
        <p className="mt-1 text-xs text-slate-500">
          Set your rates, capacity, and seasonal availability.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="pricePerDay"
              className="block text-sm font-medium text-slate-300"
            >
              Base Price (₹){" "}
              {!form.isFree && <span className="text-yellow-400">*</span>}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                name="isFree"
                checked={form.isFree}
                onChange={onChange}
                className="rounded border-white/[0.08] bg-white/[0.04] text-yellow-400 focus:ring-yellow-400/20"
              />
              Free Service
            </label>
          </div>

          <div
            className={`relative flex gap-2 ${
              form.isFree ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="relative flex-1">
              <IndianRupee
                size={15}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                id="pricePerDay"
                name="pricePerDay"
                type="number"
                className={`h-11 w-full rounded-xl border ${
                  errors.pricePerDay
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
                } bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
                placeholder="25000"
                value={form.pricePerDay}
                onChange={onChange}
              />
            </div>
            <select
              name="pricingUnit"
              className="h-11 w-32 cursor-pointer rounded-xl border border-white/[0.08] bg-[#0a1628] px-3 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
              value={form.pricingUnit}
              onChange={onChange}
            >
              <option value="per_day">Per Day</option>
              <option value="per_hour">Per Hour</option>
              <option value="per_person">Per Person</option>
              <option value="per_project">Per Project</option>
            </select>
          </div>
          {errors.pricePerDay && (
            <p className="mt-1 text-xs text-red-400">{errors.pricePerDay}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="capacity"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Capacity / Guest Limit{" "}
            <span className="text-slate-600">(optional)</span>
          </label>

          <input
            id="capacity"
            name="capacity"
            type="number"
            className={`h-11 w-full rounded-xl border ${
              errors.capacity
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="e.g. 500"
            value={form.capacity}
            onChange={onChange}
          />
          {errors.capacity && (
            <p className="mt-1 text-xs text-red-400">{errors.capacity}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="cancellationPolicy"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Cancellation Policy{" "}
            <span className="text-slate-600">(optional)</span>
          </label>

          <select
            id="cancellationPolicy"
            name="cancellationPolicy"
            className="h-11 w-full cursor-pointer rounded-xl border border-white/[0.08] bg-[#0a1628] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
            value={form.cancellationPolicy}
            onChange={onChange}
          >
            <option value="">Select a policy...</option>
            <option value="Flexible">
              Flexible (Free cancellation up to 48h)
            </option>
            <option value="Moderate">
              Moderate (Free cancellation up to 7 days)
            </option>
            <option value="Strict">Strict (No refund)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="availableFrom"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Available From <span className="text-slate-600">(optional)</span>
          </label>

          <input
            id="availableFrom"
            name="availableFrom"
            type="date"
            className={`h-11 w-full rounded-xl border ${
              errors.availableFrom
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            value={form.availableFrom}
            onChange={onChange}
          />
          {errors.availableFrom && (
            <p className="mt-1 text-xs text-red-400">{errors.availableFrom}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="availableTo"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Available To <span className="text-slate-600">(optional)</span>
          </label>

          <input
            id="availableTo"
            name="availableTo"
            type="date"
            className={`h-11 w-full rounded-xl border ${
              errors.availableTo
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            value={form.availableTo}
            onChange={onChange}
          />
          {errors.availableTo && (
            <p className="mt-1 text-xs text-red-400">{errors.availableTo}</p>
          )}
        </div>
      </div>
    </div>
  );
};
