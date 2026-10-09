"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, IndianRupee, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  validateServiceField,
  validateServiceForm,
  ServiceFormState,
} from "@/utils/serviceValidation";
import { TimeSlot } from "@/types";

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
    customCategory?: string;
    capacity?: number;
    pricingUnit?: string;
    cancellationPolicy?: string;
    amenities?: string[];
    availableFrom?: string;
    availableTo?: string;
    bookingMode?: string;
    timeSlots?: TimeSlot[];
    maxBookingsPerDay?: number;
    isFree?: boolean;
  };
}

export default function ServiceForm({ mode, serviceId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [keepImages] = useState<string[]>(initialData?.images || []);
  const [tagInput, setTagInput] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Time slot state
  const [timeSlots, setTimeSlots] = useState<Omit<TimeSlot, '_id'>[]>(
    (initialData?.timeSlots || []).map(({ label, startTime, endTime, maxBookings, isActive }) => ({
      label, startTime, endTime, maxBookings, isActive
    }))
  );
  const [showSlotBuilder, setShowSlotBuilder] = useState(
    initialData?.bookingMode === 'time_slot'
  );
  const [newSlot, setNewSlot] = useState({ label: '', startTime: '09:00', endTime: '18:00', maxBookings: 1 });

  const [form, setForm] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "venue",
    description: initialData?.description || "",
    isFree: initialData?.isFree || false,
    pricePerDay: initialData?.pricePerDay?.toString() || "",
    city: initialData?.location?.city || "",
    state: initialData?.location?.state || "",
    address: initialData?.location?.address || "",
    phone: initialData?.contact?.phone || "",
    email: initialData?.contact?.email || "",
    website: initialData?.contact?.website || "",
    tags: initialData?.tags || ([] as string[]),
    customCategory: initialData?.customCategory || "",
    capacity: initialData?.capacity?.toString() || "",
    pricingUnit: initialData?.pricingUnit || "per_day",
    cancellationPolicy: initialData?.cancellationPolicy || "",
    amenities: initialData?.amenities || ([] as string[]),
    availableFrom: initialData?.availableFrom || "",
    availableTo: initialData?.availableTo || "",
    bookingMode: initialData?.bookingMode || "date_range",
    maxBookingsPerDay: initialData?.maxBookingsPerDay?.toString() || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    
    setForm((p) => {
      let newValue: string | boolean = value;
      if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
      }
      
      const newForm = { ...p, [name]: newValue };
      if (name !== 'isFree') {
        const error = validateServiceField(name, String(newValue), newForm);
        const extraErrors: Record<string, string> = {};
        if (name === 'availableFrom' && newForm.availableTo) {
          extraErrors.availableTo = validateServiceField('availableTo', newForm.availableTo, newForm);
        } else if (name === 'availableTo' && newForm.availableFrom) {
          extraErrors.availableFrom = validateServiceField('availableFrom', newForm.availableFrom, newForm);
        }
        setErrors((prev) => ({ ...prev, [name]: error, ...extraErrors }));
      } else {
        if (newValue) {
          setErrors((prev) => ({ ...prev, pricePerDay: '' }));
        }
      }
      return newForm;
    });
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

  const addAmenity = () => {
    const amenity = amenityInput.trim();
    if (!amenity || form.amenities.includes(amenity)) return;
    setForm((p) => ({ ...p, amenities: [...p.amenities, amenity] }));
    setAmenityInput("");
  };

  const removeAmenity = (amenity: string) =>
    setForm((p) => ({
      ...p,
      amenities: p.amenities.filter((a) => a !== amenity),
    }));

  // ── Time Slot Helpers ─────────────────────────────────────────────────────
  const addSlot = () => {
    if (!newSlot.label.trim()) { toast.error('Slot label is required'); return; }
    if (newSlot.startTime >= newSlot.endTime) { toast.error('End time must be after start time'); return; }
    setTimeSlots((prev) => [...prev, { ...newSlot, isActive: true }]);
    setNewSlot({ label: '', startTime: '09:00', endTime: '18:00', maxBookings: 1 });
  };

  const removeSlot = (index: number) =>
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateServiceForm(
      form as unknown as ServiceFormState,
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("isFree", String(form.isFree));
      if (!form.isFree) formData.append("pricePerDay", form.pricePerDay);
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
      if (form.category === "other" && form.customCategory) {
        formData.append("customCategory", form.customCategory);
      }
      if (form.capacity) formData.append("capacity", form.capacity);
      if (form.pricingUnit) formData.append("pricingUnit", form.pricingUnit);
      if (form.cancellationPolicy)
        formData.append("cancellationPolicy", form.cancellationPolicy);
      if (form.amenities.length > 0)
        formData.append("amenities", JSON.stringify(form.amenities));
      if (form.availableFrom)
        formData.append("availableFrom", form.availableFrom);
      if (form.availableTo) formData.append("availableTo", form.availableTo);
      // Time slot fields
      const resolvedMode = showSlotBuilder ? 'time_slot' : form.bookingMode;
      formData.append("bookingMode", resolvedMode);
      if (timeSlots.length > 0)
        formData.append("timeSlots", JSON.stringify(timeSlots));
      if (form.maxBookingsPerDay && !showSlotBuilder)
        formData.append("maxBookingsPerDay", form.maxBookingsPerDay);

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
              className={`h-11 w-full rounded-xl border ${errors.title ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="e.g. Royal Garden Venue"
              value={form.title}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.category ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-[#0a1628] px-4 text-sm text-white outline-none transition-all focus:ring-2`}
              value={form.category}
              onChange={handleChange}
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
                className={`h-11 w-full rounded-xl border ${errors.customCategory ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
                placeholder="e.g. Makeup Artist"
                value={form.customCategory}
                onChange={handleChange}
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
            className={`min-h-[120px] w-full resize-y rounded-xl border ${errors.description ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
            rows={4}
            placeholder="Describe your service in detail…"
            value={form.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-400">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="pricePerDay"
                className="block text-sm font-medium text-slate-300"
              >
                Base Price (₹) {!form.isFree && <span className="text-yellow-400">*</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={form.isFree}
                  onChange={handleChange}
                  className="rounded border-white/[0.08] bg-white/[0.04] text-yellow-400 focus:ring-yellow-400/20"
                />
                Free Service
              </label>
            </div>

            <div className={`relative flex gap-2 ${form.isFree ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="relative flex-1">
                <IndianRupee
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  className={`h-11 w-full rounded-xl border ${errors.pricePerDay ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
                  placeholder="25000"
                  value={form.pricePerDay}
                  onChange={handleChange}
                />
              </div>
              <select
                name="pricingUnit"
                className="h-11 w-32 rounded-xl border border-white/[0.08] bg-[#0a1628] px-3 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
                value={form.pricingUnit}
                onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.capacity ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="e.g. 500"
              value={form.capacity}
              onChange={handleChange}
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
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0a1628] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
              value={form.cancellationPolicy}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.availableFrom ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              value={form.availableFrom}
              onChange={handleChange}
            />
            {errors.availableFrom && (
              <p className="mt-1 text-xs text-red-400">
                {errors.availableFrom}
              </p>
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
              className={`h-11 w-full rounded-xl border ${errors.availableTo ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              value={form.availableTo}
              onChange={handleChange}
            />
            {errors.availableTo && (
              <p className="mt-1 text-xs text-red-400">{errors.availableTo}</p>
            )}
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
              className={`h-11 w-full rounded-xl border ${errors.city ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="Mumbai"
              value={form.city}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.state ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="Maharashtra"
              value={form.state}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.address ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="123 Main St"
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-400">{errors.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
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
              className={`h-11 w-full rounded-xl border ${errors.phone ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="service@email.com"
              value={form.email}
              onChange={handleChange}
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
              className={`h-11 w-full rounded-xl border ${errors.website ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-white/[0.08] focus:border-yellow-400/40 focus:ring-yellow-400/10"} bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.06] focus:ring-2`}
              placeholder="https://example.com"
              value={form.website}
              onChange={handleChange}
            />
            {errors.website && (
              <p className="mt-1 text-xs text-red-400">{errors.website}</p>
            )}
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
            className="inline-flex h-11 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.06] hover:text-yellow-400"
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

      {/* Amenities */}
      <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="text-[15px] font-bold text-white">
            Amenities & Features
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            List the amenities or features you provide (e.g., WiFi, AC,
            Parking).
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-yellow-400/10"
            placeholder="Add an amenity (e.g. AC, Parking)"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAmenity();
              }
            }}
          />

          <button
            type="button"
            className="inline-flex h-11 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.06] hover:text-yellow-400"
            onClick={addAmenity}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {form.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-medium text-blue-400"
              >
                ✓ {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(amenity)}
                  className="flex items-center text-blue-400/50 transition-colors duration-150 hover:text-red-400"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Time Slots */}
      <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="text-[15px] font-bold text-white">Booking Mode &amp; Time Slots</h3>
          <p className="mt-1 text-xs text-slate-500">
            Choose how customers book this service.
          </p>
        </div>

        {/* Booking Mode Selector */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            { value: 'date_range', label: '📅 Date Range', desc: 'Multi-day booking (venue, hotel)' },
            { value: 'single_day', label: '📆 Single Day', desc: 'One specific day (decorator, caterer)' },
            { value: 'time_slot', label: '🕐 Time Slots', desc: 'Specific sessions per day (DJ, cameraman)' },
          ] as { value: string; label: string; desc: string }[]).map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => {
                setForm((p) => ({ ...p, bookingMode: mode.value }));
                setShowSlotBuilder(mode.value === 'time_slot');
              }}
              className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-200 ${
                (showSlotBuilder ? 'time_slot' : form.bookingMode) === mode.value
                  ? 'border-yellow-400/50 bg-yellow-400/[0.07] text-white'
                  : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/[0.15] hover:text-slate-200'
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
              value={form.maxBookingsPerDay}
              onChange={handleChange}
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
                      <p className="text-sm font-medium text-white">{slot.label}</p>
                      <p className="text-xs text-slate-500">
                        {slot.startTime} – {slot.endTime} · max {slot.maxBookings} booking{slot.maxBookings > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Slot */}
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.015] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Add a Time Slot</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Slot label (e.g. Morning Show, Evening Session)"
                    value={newSlot.label}
                    onChange={(e) => setNewSlot((p) => ({ ...p, label: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot((p) => ({ ...p, startTime: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot((p) => ({ ...p, endTime: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Max Bookings per Slot</label>
                  <input
                    type="number"
                    min={1}
                    value={newSlot.maxBookings}
                    onChange={(e) => setNewSlot((p) => ({ ...p, maxBookings: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition-all focus:border-yellow-400/40 focus:ring-2 focus:ring-yellow-400/10"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addSlot}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-400/20"
                  >
                    <Plus size={14} /> Add Slot
                  </button>
                </div>
              </div>
            </div>

            {timeSlots.length === 0 && (
              <p className="text-center text-xs text-slate-600">No slots yet. Add at least one slot above.</p>
            )}
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
            <p className="font-medium text-slate-300">Click to upload images</p>
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
          className="inline-flex cursor-pointer h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
          onClick={() => router.back()}
        >
          Cancel
        </button>

        <button
          id="service-submit-btn"
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-400 px-6 cursor-pointer text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
