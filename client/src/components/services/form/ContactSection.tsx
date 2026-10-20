import React from "react";
import { ServiceFormData } from "./types";

interface ContactSectionProps {
  form: ServiceFormData;
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  form,
  errors,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">Contact Details</h3>
        <p className="mt-1 text-xs text-slate-500">
          Add contact information customers can use.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Phone <span className="text-yellow-400">*</span>
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            className={`h-11 w-full rounded-xl border ${
              errors.phone
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={onChange}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Email <span className="text-yellow-400">*</span>
          </label>

          <input
            id="email"
            name="email"
            type="email"
            className={`h-11 w-full rounded-xl border ${
              errors.email
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="service@email.com"
            value={form.email}
            onChange={onChange}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="website"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Website <span className="text-slate-600">(optional)</span>
          </label>

          <input
            id="website"
            name="website"
            type="url"
            className={`h-11 w-full rounded-xl border ${
              errors.website
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="https://example.com"
            value={form.website}
            onChange={onChange}
          />
          {errors.website && (
            <p className="mt-1 text-xs text-red-400">{errors.website}</p>
          )}
        </div>
      </div>
    </div>
  );
};
