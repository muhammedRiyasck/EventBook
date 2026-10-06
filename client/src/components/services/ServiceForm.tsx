"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus } from "lucide-react";
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
      className="flex flex-col gap-8"
      id="service-form"
    >
      {/* Basic Info */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-white mb-1 pb-3 border-b border-white/10">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Service Title *</label>
            <input
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. Royal Garden Venue"
              value={form.title}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category"
              className="form-input"
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
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-input"
            rows={4}
            placeholder="Describe your service in detail…"
            value={form.description}
            onChange={handleChange}
            required
            minLength={10}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Price Per Day (₹) *</label>
          <input
            name="pricePerDay"
            type="number"
            className="form-input"
            placeholder="25000"
            value={form.pricePerDay}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-white mb-1 pb-3 border-b border-white/10">
          Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              name="city"
              type="text"
              className="form-input"
              placeholder="Mumbai"
              value={form.city}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <input
              name="state"
              type="text"
              className="form-input"
              placeholder="Maharashtra"
              value={form.state}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address *</label>
            <input
              name="address"
              type="text"
              className="form-input"
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
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-white mb-1 pb-3 border-b border-white/10">
          Contact Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input
              name="phone"
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="service@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Website (optional)</label>
            <input
              name="website"
              type="url"
              className="form-input"
              placeholder="https://example.com"
              value={form.website}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-white mb-1 pb-3 border-b border-white/10">
          Tags
        </h3>
        <div className="flex gap-2.5 items-center">
          <input
            type="text"
            className="form-input flex-1"
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
            className="btn btn-secondary btn-sm"
            onClick={addTag}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-[#ffd700]/10 border border-[#ffd700]/20 rounded-full text-[12px] text-[var(--gold-400)]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="bg-transparent text-[var(--gold-400)]/60 flex items-center transition-colors duration-150 hover:text-[var(--gold-400)]"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <h3 className="text-[15px] font-bold text-white mb-1 pb-3 border-b border-white/10">
          Images (max 5)
        </h3>
        <label
          className="flex flex-col items-center gap-2.5 p-8 border-2 border-dashed border-white/10 rounded-lg cursor-pointer text-slate-400 text-[14px] text-center transition-colors duration-200 hover:border-[var(--gold-400)] hover:text-[var(--gold-400)]"
          htmlFor="image-upload"
        >
          <Upload size={24} />
          <span>Click to upload images (JPEG, PNG, WebP · max 5MB each)</span>
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
          <div className="flex gap-3 flex-wrap mt-1">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative w-[100px] h-[80px] rounded overflow-hidden border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center transition-colors duration-150 hover:bg-red-500"
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
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button
          id="service-submit-btn"
          type="submit"
          className="btn btn-primary"
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
  );
}
