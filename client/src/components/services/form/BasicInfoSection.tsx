import React from "react";
import { ServiceFormData, CATEGORIES } from "./types";

interface BasicInfoSectionProps {
  form: ServiceFormData;
  errors: Record<string, string>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  errors,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">Basic Information</h3>
        <p className="mt-1 text-xs text-slate-500">
          Add the main details of your service.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Service Title <span className="text-yellow-400">*</span>
          </label>

          <input
            id="title"
            name="title"
            type="text"
            className={`h-11 w-full rounded-xl border ${
              errors.title
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            placeholder="e.g. Royal Garden Venue"
            value={form.title}
            onChange={onChange}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-400">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Category <span className="text-yellow-400">*</span>
          </label>

          <select
            id="category"
            name="category"
            className={`h-11 w-full rounded-xl border cursor-pointer ${
              errors.category
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
            } bg-[#0a1628] px-4 text-sm text-white outline-none transition-all focus:ring-2`}
            value={form.category}
            onChange={onChange}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {form.category === "other" && (
          <div>
            <label
              htmlFor="customCategory"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Specify Category <span className="text-yellow-400">*</span>
            </label>
            <input
              id="customCategory"
              name="customCategory"
              type="text"
              className={`h-11 w-full rounded-xl border ${
                errors.customCategory
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
              } bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="e.g. Makeup Artist"
              value={form.customCategory}
              onChange={onChange}
            />
            {errors.customCategory && (
              <p className="mt-1 text-xs text-red-400">
                {errors.customCategory}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Description <span className="text-yellow-400">*</span>
        </label>

        <textarea
          id="description"
          name="description"
          className={`min-h-[120px] w-full resize-y rounded-xl border ${
            errors.description
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
              : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"
          } bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
          rows={4}
          placeholder="Describe your service in detail…"
          value={form.description}
          onChange={onChange}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-400">{errors.description}</p>
        )}
      </div>
    </div>
  );
};
