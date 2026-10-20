"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  validateServiceField,
  validateServiceForm,
  ServiceFormState,
} from "@/utils/serviceValidation";
import {
  ServiceFormData,
  ServiceFormInitialData,
  SlotItem,
} from "./form/types";
import { compressImage } from "./form/compressImage";
import { BasicInfoSection } from "./form/BasicInfoSection";
import { PricingSection } from "./form/PricingSection";
import { LocationSection } from "./form/LocationSection";
import { ContactSection } from "./form/ContactSection";
import { TagsAndAmenitiesSection } from "./form/TagsAndAmenitiesSection";
import { AvailabilitySection } from "./form/AvailabilitySection";
import { ImagesSection } from "./form/ImagesSection";

interface Props {
  mode: "create" | "edit";
  serviceId?: string;
  initialData?: ServiceFormInitialData;
}

export default function ServiceForm({ mode, serviceId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.images || []
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Time slot state
  const [timeSlots, setTimeSlots] = useState<SlotItem[]>(
    (initialData?.timeSlots || []).map(
      ({ label, startTime, endTime, maxBookings, isActive }) => ({
        label,
        startTime,
        endTime,
        maxBookings,
        isActive,
      })
    )
  );
  const [showSlotBuilder, setShowSlotBuilder] = useState(
    initialData?.bookingMode === "time_slot"
  );
  const [newSlot, setNewSlot] = useState({
    label: "",
    startTime: "09:00",
    endTime: "18:00",
    maxBookings: 1,
  });

  const [form, setForm] = useState<ServiceFormData>({
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
    tags: initialData?.tags || [],
    customCategory: initialData?.customCategory || "",
    capacity: initialData?.capacity?.toString() || "",
    pricingUnit: initialData?.pricingUnit || "per_day",
    cancellationPolicy: initialData?.cancellationPolicy || "",
    amenities: initialData?.amenities || [],
    availableFrom: initialData?.availableFrom || "",
    availableTo: initialData?.availableTo || "",
    bookingMode: initialData?.bookingMode || "date_range",
    maxBookingsPerDay: initialData?.maxBookingsPerDay?.toString() || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setForm((p) => {
      let newValue: string | boolean = value;
      if (type === "checkbox") {
        newValue = (e.target as HTMLInputElement).checked;
      }

      const newForm = { ...p, [name]: newValue };
      if (name !== "isFree") {
        const error = validateServiceField(name, String(newValue), newForm);
        const extraErrors: Record<string, string> = {};
        if (name === "availableFrom" && newForm.availableTo) {
          extraErrors.availableTo = validateServiceField(
            "availableTo",
            newForm.availableTo,
            newForm
          );
        } else if (name === "availableTo" && newForm.availableFrom) {
          extraErrors.availableFrom = validateServiceField(
            "availableFrom",
            newForm.availableFrom,
            newForm
          );
        }
        setErrors((prev) => ({ ...prev, [name]: error, ...extraErrors }));
      } else {
        if (newValue) {
          setErrors((prev) => ({ ...prev, pricePerDay: "" }));
        }
      }
      return newForm;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const currentTotal = existingImages.length + newFiles.length;
    if (currentTotal + rawFiles.length > 5) {
      toast.error(`Max 5 images allowed in total (currently ${currentTotal})`);
      return;
    }

    const oversized = rawFiles.find((f) => f.size > 15 * 1024 * 1024);
    if (oversized) {
      toast.error(`"${oversized.name}" exceeds 15MB limit.`);
      return;
    }

    setCompressing(true);
    try {
      const processed: File[] = [];
      const previews: string[] = [];
      for (const file of rawFiles) {
        const compressed = await compressImage(file);
        processed.push(compressed);
        previews.push(URL.createObjectURL(compressed));
      }
      setNewFiles((prev) => [...prev, ...processed]);
      setNewFilePreviews((prev) => [...prev, ...previews]);
    } catch {
      toast.error("Failed to process some images");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      toast.success("Existing image removed (save changes to confirm)");
    } else {
      const newIdx = index - existingImages.length;
      if (newFilePreviews[newIdx]) {
        URL.revokeObjectURL(newFilePreviews[newIdx]);
      }
      setNewFiles((prev) => prev.filter((_, i) => i !== newIdx));
      setNewFilePreviews((prev) => prev.filter((_, i) => i !== newIdx));
      toast.success("New image removed");
    }
  };

  const removeAllExisting = () => {
    setExistingImages([]);
    toast.success("All existing images removed (save changes to confirm)");
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

  const addSlot = () => {
    if (!newSlot.label.trim()) {
      toast.error("Slot label is required");
      return;
    }
    if (newSlot.startTime >= newSlot.endTime) {
      toast.error("End time must be after start time");
      return;
    }
    setTimeSlots((prev) => [...prev, { ...newSlot, isActive: true }]);
    setNewSlot({
      label: "",
      startTime: "09:00",
      endTime: "18:00",
      maxBookings: 1,
    });
  };

  const removeSlot = (index: number) =>
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateServiceForm(
      form as unknown as ServiceFormState
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
        })
      );
      formData.append(
        "contact",
        JSON.stringify({
          phone: form.phone,
          email: form.email,
          website: form.website,
        })
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
      const resolvedMode = showSlotBuilder ? "time_slot" : form.bookingMode;
      formData.append("bookingMode", resolvedMode);
      if (timeSlots.length > 0)
        formData.append("timeSlots", JSON.stringify(timeSlots));
      if (form.maxBookingsPerDay && !showSlotBuilder)
        formData.append("maxBookingsPerDay", form.maxBookingsPerDay);

      if (mode === "edit") {
        formData.append("keepImages", JSON.stringify(existingImages));
      }
      newFiles.forEach((img) => formData.append("images", img));

      if (mode === "create") {
        await api.post("/services", formData);
        toast.success("Service created successfully!");
      } else {
        await api.put(`/services/${serviceId}`, formData);
        toast.success("Service updated!");
      }
      router.push("/admin/services");
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ msg?: string; message?: string }>;
          };
        };
      };
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.msg ||
        error?.response?.data?.errors?.[0]?.message ||
        "Failed to save service";
      toast.error(apiMessage);
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
      <BasicInfoSection
        form={form}
        errors={errors}
        onChange={handleChange}
      />

      <PricingSection
        form={form}
        errors={errors}
        onChange={handleChange}
      />

      <LocationSection
        form={form}
        errors={errors}
        onChange={handleChange}
      />

      <ContactSection
        form={form}
        errors={errors}
        onChange={handleChange}
      />

      <TagsAndAmenitiesSection
        tags={form.tags}
        tagInput={tagInput}
        onTagInputChange={setTagInput}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        amenities={form.amenities}
        amenityInput={amenityInput}
        onAmenityInputChange={setAmenityInput}
        onAddAmenity={addAmenity}
        onRemoveAmenity={removeAmenity}
      />

      <AvailabilitySection
        bookingMode={form.bookingMode}
        onBookingModeChange={(m) =>
          setForm((p) => ({ ...p, bookingMode: m }))
        }
        showSlotBuilder={showSlotBuilder}
        setShowSlotBuilder={setShowSlotBuilder}
        maxBookingsPerDay={form.maxBookingsPerDay}
        onMaxBookingsChange={handleChange}
        timeSlots={timeSlots}
        newSlot={newSlot}
        setNewSlot={setNewSlot}
        onAddSlot={addSlot}
        onRemoveSlot={removeSlot}
      />

      <ImagesSection
        existingImages={existingImages}
        newFiles={newFiles}
        newFilePreviews={newFilePreviews}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        onRemoveAllExisting={removeAllExisting}
      />

      {/* Submit / Cancel Buttons */}
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 cursor-pointer text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={loading || compressing}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              {newFiles.length > 0 ? "Uploading images…" : "Saving…"}
            </>
          ) : compressing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              Optimizing images…
            </>
          ) : mode === "create" ? (
            "Create Service"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
