import React from "react";
import { ServiceFormData } from "./types";

interface LocationSectionProps {
  form: ServiceFormData;
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  form,
  errors,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">Location</h3>
        <p className="mt-1 text-xs text-slate-500">
          Where is this service located?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label
            htmlFor="city"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            City <span className="text-yellow-400">*</span>
          </label>

          <input
            id="city"
            name="city"
            type="text"
            className={`h-11 w-full rounded-xl border ${
              errors.city
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="Mumbai"
            value={form.city}
            onChange={onChange}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-400">{errors.city}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="state"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            State <span className="text-yellow-400">*</span>
          </label>

          <input
            id="state"
            name="state"
            type="text"
            className={`h-11 w-full rounded-xl border ${
              errors.state
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="Maharashtra"
            value={form.state}
            onChange={onChange}
          />
          {errors.state && (
            <p className="mt-1 text-xs text-red-400">{errors.state}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Address <span className="text-yellow-400">*</span>
          </label>

          <input
            id="address"
            name="address"
            type="text"
            className={`h-11 w-full rounded-xl border ${
              errors.address
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="123 Main St"
            value={form.address}
            onChange={onChange}
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-400">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );
};
