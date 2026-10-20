import React from "react";
import {
  Search,
  X,
  Table as TableIcon,
  LayoutGrid,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SortByOption } from "@/hooks/useAdminServices";

interface ServicesFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedMode: string;
  onModeChange: (val: string) => void;
  sortBy: SortByOption;
  onSortChange: (val: SortByOption) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollTable: (direction: "left" | "right") => void;
}

export const ServicesFilterBar: React.FC<ServicesFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedMode,
  onModeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
  canScrollLeft,
  canScrollRight,
  onScrollTable,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, location, tag, amenity..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-9 text-sm text-white placeholder-slate-500 transition-all focus:border-yellow-400/40 focus:bg-white/[0.07] focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-11 rounded-xl cursor-pointer border border-white/10 bg-[#071329] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-white/20 focus:border-yellow-400/40 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="venue">🏛️ Venue</option>
              <option value="hotel">🏨 Hotel</option>
              <option value="caterer">🍽️ Caterer</option>
              <option value="cameraman">📷 Cameraman</option>
              <option value="dj">🎧 DJ & Music</option>
              <option value="decorator">🌸 Decorator</option>
              <option value="other">✨ Other</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div className="relative">
            <select
              value={selectedMode}
              onChange={(e) => onModeChange(e.target.value)}
              className="h-11 rounded-xl cursor-pointer border border-white/10 bg-[#071329] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-white/20 focus:border-yellow-400/40 focus:outline-none"
            >
              <option value="all">All Booking Modes</option>
              <option value="date_range">📅 Date Range</option>
              <option value="single_day">☀️ Single Day</option>
              <option value="time_slot">⏰ Time Slots</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortByOption)}
              className="h-11 rounded-xl border cursor-pointer border-white/10 bg-[#071329] px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-white/20 focus:border-yellow-400/40 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          {/* View Switcher (Table / Grid) */}
          <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-yellow-400 font-bold text-[#050d1e] shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-yellow-400 font-bold text-[#050d1e] shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-400/20"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicators & Table Scroll Navigator */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
        <div>
          Showing <span className="font-bold text-white">{filteredCount}</span>{" "}
          of <span className="font-bold text-white">{totalCount}</span> services
          {searchTerm && (
            <span className="ml-1 text-yellow-400">
              matching &ldquo;{searchTerm}&rdquo;
            </span>
          )}
        </div>

        {/* Horizontal Scroll Helpers (only active in table view) */}
        {viewMode === "table" && (
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex">
              <ArrowRight size={12} className="text-yellow-400" />
              Scroll table horizontally for full data
            </span>

            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-0.5">
              <button
                type="button"
                onClick={() => onScrollTable("left")}
                disabled={!canScrollLeft}
                className="flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => onScrollTable("right")}
                disabled={!canScrollRight}
                className="flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                title="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesFilterBar;
