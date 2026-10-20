import React from "react";
import { Upload, X } from "lucide-react";

interface ImagesSectionProps {
  existingImages: string[];
  newFiles: File[];
  newFilePreviews: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveAllExisting: () => void;
}

export const ImagesSection: React.FC<ImagesSectionProps> = ({
  existingImages,
  newFiles,
  newFilePreviews,
  onImageChange,
  onRemoveImage,
  onRemoveAllExisting,
}) => {
  const totalCount = existingImages.length + newFiles.length;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-white">Images</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                totalCount >= 5
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/[0.06] text-slate-300"
              }`}
            >
              {totalCount} / 5
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Upload JPEG, PNG, or WebP images. You can remove existing photos and
            add new ones.
          </p>
        </div>

        {existingImages.length > 0 && (
          <button
            type="button"
            onClick={onRemoveAllExisting}
            className="cursor-pointer text-xs font-medium text-red-400/90 transition-colors hover:text-red-300"
          >
            Clear all existing ({existingImages.length})
          </button>
        )}
      </div>

      {totalCount < 5 ? (
        <label
          htmlFor="image-upload"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500 transition-all duration-200 hover:border-yellow-400/30 hover:bg-yellow-400/[0.025] hover:text-yellow-400"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Upload size={22} />
          </div>

          <div>
            <p className="font-medium text-slate-300">
              Click to upload new images
            </p>
            <p className="mt-1 text-xs text-slate-600">
              JPEG, PNG, WebP · Max 5MB each (auto-optimized)
            </p>
          </div>

          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onImageChange}
          />
        </label>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-xs text-slate-400">
          Maximum limit of 5 images reached. Remove an image below to upload a
          new one.
        </div>
      )}

      {existingImages.length + newFilePreviews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            ...existingImages.map((src) => ({ src, isExisting: true })),
            ...newFilePreviews.map((src) => ({ src, isExisting: false })),
          ].map((item, i) => (
            <div
              key={i}
              className="group relative h-24 w-28 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {item.isExisting ? (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-sm">
                  Current
                </span>
              ) : (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-yellow-400 px-1.5 py-0.5 text-[9px] font-bold text-slate-900 backdrop-blur-sm">
                  New
                </span>
              )}

              <button
                type="button"
                title="Remove image"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-red-500"
                onClick={() => onRemoveImage(i)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
