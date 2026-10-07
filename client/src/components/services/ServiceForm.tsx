"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const CATEGORIES = [
  "venue",
  "hotel",
  "caterer",
  "cameraman",
  "dj",
  "decorator",
  "other",
];

interface Props {
  mode: "create" | "edit";
  serviceId?: string;
  initialData?: {
    title?: string;
    category?: string;
    description?: string;
    pricePerDay?: number;
    location?: { city: string; state: string; address: string };
    contact?: { phone: string; email: string; website?: string };
    tags?: string[];
    images?: string[];
  };
}

export default function ServiceForm({ mode, serviceId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [keepImages] = useState<string[]>(initialData?.images || []);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "venue",
    description: initialData?.description || "",
    pricePerDay: initialData?.pricePerDay?.toString() || "",
    city: initialData?.location?.city || "",
    state: initialData?.location?.state || "",
    address: initialData?.location?.address || "",
    phone: initialData?.contact?.phone || "",
    email: initialData?.contact?.email || "",
    website: initialData?.contact?.website || "",
    tags: initialData?.tags || ([] as string[]),
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error("Max 5 images allowed");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    if (index < keepImages.length) return; // don't remove existing cloud images here
    const newIdx = index - keepImages.length;
    setImages((prev) => prev.filter((_, i) => i !== newIdx));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) return;
    setForm((p) => ({ ...p, tags: [...p.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.description ||
      !form.pricePerDay ||
      !form.phone ||
      !form.email ||
      !form.city ||
      !form.state ||
      !form.address
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (Number(form.pricePerDay) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("pricePerDay", form.pricePerDay);
      formData.append(
        "location",
        JSON.stringify({
          city: form.city,
          state: form.state,
          address: form.address,
        }),
      );
      formData.append(
        "contact",
        JSON.stringify({
          phone: form.phone,
          email: form.email,
          website: form.website,
        }),
      );
      formData.append("tags", JSON.stringify(form.tags));
      if (mode === "edit")
        formData.append("keepImages", JSON.stringify(keepImages));
      images.forEach((img) => formData.append("images", img));

      if (mode === "create") {
        await api.post("/services", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Service created successfully!");
      } else {
        await api.put(`/services/${serviceId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Service updated!");
      }
      router.push("/admin/services");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
  <form
    onSubmit={handleSubmit}
    className="flex flex-col gap-6"
    id="service-form"
  >
    {/* Basic Info */}
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">
          Basic Information
        </h3>
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="e.g. Royal Garden Venue"
            value={form.title}
            onChange={handleChange}
            required
            minLength={3}
          />
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0a1628] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
            value={form.category}
            onChange={handleChange}
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
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
          className="min-h-[120px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
          rows={4}
          placeholder="Describe your service in detail…"
          value={form.description}
          onChange={handleChange}
          required
          minLength={10}
        />
      </div>

      <div className="max-w-md">
        <label
          htmlFor="pricePerDay"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Price Per Day (₹) <span className="text-yellow-400">*</span>
        </label>

        <div className="relative">
          <IndianRupee
            size={15}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            id="pricePerDay"
            name="pricePerDay"
            type="number"
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="25000"
            value={form.pricePerDay}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
      </div>
    </div>

    {/* Location */}
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="Mumbai"
            value={form.city}
            onChange={handleChange}
            required
            minLength={2}
          />
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="Maharashtra"
            value={form.state}
            onChange={handleChange}
            required
            minLength={2}
          />
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="123 Main St"
            value={form.address}
            onChange={handleChange}
            required
            minLength={5}
          />
        </div>
      </div>
    </div>

    {/* Contact */}
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">
          Contact Details
        </h3>
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={handleChange}
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit phone number"
            required
          />
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="service@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
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
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="https://example.com"
            value={form.website}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>

    {/* Tags */}
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">Tags</h3>
        <p className="mt-1 text-xs text-slate-500">
          Add tags to help customers discover your service.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
          placeholder="Add a tag (e.g. luxury, outdoor)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />

        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.06] hover:text-yellow-400"
          onClick={addTag}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {form.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/15 bg-yellow-400/[0.07] px-3 py-1.5 text-xs font-medium text-yellow-400"
            >
              #{tag}

              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="flex items-center text-yellow-400/50 transition-colors duration-150 hover:text-red-400"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>

    {/* Images */}
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/[0.08] pb-4">
        <h3 className="text-[15px] font-bold text-white">
          Images <span className="text-slate-500">(max 5)</span>
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Upload JPEG, PNG, or WebP images up to 5MB each.
        </p>
      </div>

      <label
        htmlFor="image-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500 transition-all duration-200 hover:border-yellow-400/30 hover:bg-yellow-400/[0.025] hover:text-yellow-400"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
          <Upload size={22} />
        </div>

        <div>
          <p className="font-medium text-slate-300">
            Click to upload images
          </p>
          <p className="mt-1 text-xs text-slate-600">
            JPEG, PNG, WebP · Max 5MB each
          </p>
        </div>

        <input
          id="image-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageChange}
        />
      </label>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div
              key={i}
              className="group relative h-24 w-28 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <button
                type="button"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-red-500"
                onClick={() => removeImage(i)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Submit */}
    <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
        onClick={() => router.back()}
      >
        Cancel
      </button>

      <button
        id="service-submit-btn"
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-400 px-6 text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        disabled={loading}
      >
        {loading
          ? "Saving…"
          : mode === "create"
            ? "Create Service"
            : "Save Changes"}
      </button>
    </div>
  </form>
  )}
