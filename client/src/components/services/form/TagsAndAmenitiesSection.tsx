import React from "react";
import { Plus, X } from "lucide-react";

interface TagsAndAmenitiesSectionProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  amenities: string[];
  amenityInput: string;
  onAmenityInputChange: (val: string) => void;
  onAddAmenity: () => void;
  onRemoveAmenity: (amenity: string) => void;
}

export const TagsAndAmenitiesSection: React.FC<TagsAndAmenitiesSectionProps> = ({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  amenities,
  amenityInput,
  onAmenityInputChange,
  onAddAmenity,
  onRemoveAmenity,
}) => {
  return (
    <>
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
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddTag();
              }
            }}
          />

          <button
            type="button"
            className="inline-flex h-11 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.06] hover:text-yellow-400"
            onClick={onAddTag}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/15 bg-yellow-400/[0.07] px-3 py-1.5 text-xs font-medium text-yellow-400"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="flex items-center cursor-pointer text-yellow-400/50 transition-colors duration-150 hover:text-red-400"
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
            onChange={(e) => onAmenityInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddAmenity();
              }
            }}
          />

          <button
            type="button"
            className="inline-flex h-11 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-yellow-400/20 hover:bg-yellow-400/[0.06] hover:text-yellow-400"
            onClick={onAddAmenity}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-medium text-blue-400"
              >
                ✓ {amenity}
                <button
                  type="button"
                  onClick={() => onRemoveAmenity(amenity)}
                  className="flex items-center cursor-pointer text-blue-400/50 transition-colors duration-150 hover:text-red-400"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
