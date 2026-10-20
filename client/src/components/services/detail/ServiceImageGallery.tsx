import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_ICONS } from "./types";

interface ServiceImageGalleryProps {
  images: string[];
  title: string;
  category: string;
  activeImage: number;
  setActiveImage: React.Dispatch<React.SetStateAction<number>>;
}

export const ServiceImageGallery: React.FC<ServiceImageGalleryProps> = ({
  images,
  title,
  category,
  activeImage,
  setActiveImage,
}) => {
  return (
    <div className="mb-9">
      <div className="group relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1628] shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:h-[480px]">
        {images.length > 0 ? (
          <Image
            src={images[activeImage]}
            alt={title}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            sizes="(max-width: 1024px) 100vw, 65vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d1d36] to-[#101c38]">
            <span className="text-7xl opacity-80">{CATEGORY_ICONS[category]}</span>
          </div>
        )}

        {/* Image overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            {activeImage + 1} / {images.length}
          </div>
        )}

        {/* Previous */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-yellow-400/40 hover:bg-yellow-400/15 hover:text-yellow-400"
              onClick={() =>
                setActiveImage((p) => (p - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft size={20} className="cursor-pointer" />
            </button>

            {/* Next */}
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:border-yellow-400/40 hover:bg-yellow-400/15 hover:text-yellow-400"
              onClick={() => setActiveImage((p) => (p + 1) % images.length)}
            >
              <ChevronRight size={20} className="cursor-pointer" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                i === activeImage
                  ? "border-yellow-400 ring-2 ring-yellow-400/15"
                  : "border-white/10 opacity-60 hover:border-white/25 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${title} ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
