"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Service, Pagination, ServiceFilters } from "@/types";
import ServiceCard from "@/components/services/ServiceCard";

const CATEGORIES = [
  "venue",
  "hotel",
  "caterer",
  "cameraman",
  "dj",
  "decorator",
  "other",
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "pricePerDay_asc", label: "Price: Low to High" },
  { value: "pricePerDay_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Top Rated" },
];

export default function ServicesPageContent() {
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ServiceFilters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    page: searchParams.get("page") || "1",
  });

  const fetchServices = useCallback(async (f: ServiceFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const { data } = await api.get(`/services?${params.toString()}`);
      setServices(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices(filters);
  }, [filters, fetchServices]);

  const updateFilter = (key: keyof ServiceFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? "1" : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      page: "1",
    });
  };

  const hasActiveFilters =
    filters.category || filters.city || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[110px]" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-yellow-400/10 blur-[110px]" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/[0.08] blur-[120px]" />
      </div>

      {/* Main */}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-8 bg-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                EventBook
              </span>
            </div>

            <h1 className="font-['Outfit'] text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Browse Services
            </h1>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              {pagination
                ? `${pagination.totalItems} services found`
                : "Discover event services near you"}
            </p>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0a1628]/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}
            <div className="group relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-yellow-400"
              />

              <input
                id="service-search"
                type="text"
                placeholder="Search venues, caterers, DJs..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-yellow-400/50 focus:bg-black/30 focus:ring-4 focus:ring-yellow-400/[0.06]"
              />

              {filters.search && (
                <button
                  type="button"
                  onClick={() => updateFilter("search", "")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-[#0a1628] px-4 text-sm text-slate-300 outline-none transition hover:border-white/20 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/[0.06] lg:w-[190px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Filter Button */}
            <button
              id="filter-toggle-btn"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition ${
                showFilters
                  ? "border-yellow-400/40 bg-yellow-400/[0.08] text-yellow-400"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
              )}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Category */}
                <div>
                  <label
                    htmlFor="category-filter"
                    className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    Category
                  </label>

                  <select
                    id="category-filter"
                    value={filters.category}
                    onChange={(e) => updateFilter("category", e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-300 outline-none transition hover:border-white/20 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/[0.06]"
                  >
                    <option value="">All Categories</option>

                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city-filter"
                    className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    City
                  </label>

                  <input
                    id="city-filter"
                    type="text"
                    placeholder="e.g. Mumbai, Delhi"
                    value={filters.city}
                    onChange={(e) => updateFilter("city", e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/[0.06]"
                  />
                </div>

                {/* Min Price */}
                <div>
                  <label
                    htmlFor="min-price-filter"
                    className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    Min Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ₹
                    </span>

                    <input
                      id="min-price-filter"
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter("minPrice", e.target.value)}
                      min="0"
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/[0.06]"
                    />
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label
                    htmlFor="max-price-filter"
                    className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    Max Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ₹
                    </span>

                    <input
                      id="max-price-filter"
                      type="number"
                      placeholder="No limit"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter("maxPrice", e.target.value)}
                      min="0"
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/[0.06]"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    id="clear-filters-btn"
                    onClick={clearFilters}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-yellow-400"
                  >
                    <X size={14} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count / Active State */}
        {!loading && services.length > 0 && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-lg font-bold text-slate-500 text-white">
              Showing{" "}
              <span className="font-bold font-lg text-slate-300">
                {services.length}
              </span>{" "}
              services
            </p>

            {hasActiveFilters && (
              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/[0.06] px-3 py-1 text-xs text-yellow-400">
                Filters applied
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"
              >
                <div className="skeleton h-[210px] w-full rounded-none" />

                <div className="flex flex-col gap-3 p-5">
                  <div
                    className="skeleton h-5 rounded"
                    style={{ width: "70%" }}
                  />

                  <div
                    className="skeleton h-3 rounded"
                    style={{ width: "45%" }}
                  />

                  <div
                    className="skeleton h-3 rounded"
                    style={{ width: "90%" }}
                  />

                  <div
                    className="skeleton mt-2 h-6 rounded"
                    style={{ width: "35%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          /* Empty State */
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-white/[0.07] bg-[#0a1628]/60 px-6 text-center backdrop-blur-xl">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-2xl">
              🔍
            </div>

            <h3 className="text-xl font-bold text-white">No services found</h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Try adjusting your filters or search terms to find what you're
              looking for.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 text-sm font-semibold text-[#0f1c3f] shadow-[0_0_20px_rgba(255,215,0,0.15)] transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.25)]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Services */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              id="prev-page-btn"
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() =>
                updateFilter("page", String(pagination.currentPage - 1))
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="rounded-xl border border-white/[0.06] bg-[#0a1628]/70 px-5 py-2 text-sm text-slate-400">
              Page{" "}
              <strong className="font-semibold text-white">
                {pagination.currentPage}
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-white">
                {pagination.totalPages}
              </strong>
            </div>

            <button
              id="next-page-btn"
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() =>
                updateFilter("page", String(pagination.currentPage + 1))
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
