"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  IndianRupee,
  Search,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Shield,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  Star,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Service, ServiceCategory, BookingMode } from "@/types";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_MAP: Record<
  ServiceCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  venue: {
    label: "Venue",
    icon: "🏛️",
    badgeClass: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  },
  hotel: {
    label: "Hotel",
    icon: "🏨",
    badgeClass: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  },
  caterer: {
    label: "Caterer",
    icon: "🍽️",
    badgeClass: "bg-orange-400/10 text-orange-300 border-orange-400/25",
  },
  cameraman: {
    label: "Cameraman",
    icon: "📷",
    badgeClass: "bg-purple-400/10 text-purple-300 border-purple-400/25",
  },
  dj: {
    label: "DJ & Music",
    icon: "🎧",
    badgeClass: "bg-pink-400/10 text-pink-300 border-pink-400/25",
  },
  decorator: {
    label: "Decorator",
    icon: "🌸",
    badgeClass: "bg-rose-400/10 text-rose-300 border-rose-400/25",
  },
  other: {
    label: "Other",
    icon: "✨",
    badgeClass: "bg-cyan-400/10 text-cyan-300 border-cyan-400/25",
  },
};

const BOOKING_MODE_MAP: Record<
  BookingMode,
  { label: string; badgeClass: string; icon: string }
> = {
  date_range: {
    label: "Date Range",
    badgeClass: "bg-blue-400/10 text-blue-300 border-blue-400/25",
    icon: "📅",
  },
  single_day: {
    label: "Single Day",
    badgeClass: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
    icon: "☀️",
  },
  time_slot: {
    label: "Time Slots",
    badgeClass: "bg-violet-400/10 text-violet-300 border-violet-400/25",
    icon: "⏰",
  },
};

const CANCELLATION_BADGE: Record<
  string,
  { label: string; badgeClass: string }
> = {
  Flexible: {
    label: "Flexible",
    badgeClass: "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
  },
  Moderate: {
    label: "Moderate",
    badgeClass: "bg-amber-400/10 text-amber-400 border-amber-400/25",
  },
  Strict: {
    label: "Strict",
    badgeClass: "bg-rose-400/10 text-rose-400 border-rose-400/25",
  },
};

const PRICING_UNIT_LABEL: Record<string, string> = {
  per_day: "per day",
  per_hour: "per hr",
  per_person: "per guest",
  per_project: "per event",
};

export default function AdminServicesPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 15;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price_asc" | "price_desc" | "rating_desc" | "title"
  >("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Horizontal scroll state & refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        includeInactive: "true",
        sort: sortBy,
      });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedMode !== "all") params.set("bookingMode", selectedMode);

      const { data } = await api.get(`/services?${params.toString()}`);
      setServices(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, selectedCategory, selectedMode, searchTerm]);

  // Debounce search and filter queries
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin) {
        fetchServices();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isAdmin, fetchServices]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}"? This will hide it from users.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/services/${id}`);
      toast.success("Service removed successfully");
      fetchServices();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-IN").format(val);

  const formatDate = (d?: string | Date) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  // Check scroll position
  const updateScrollButtons = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [services, viewMode, updateScrollButtons]);

  const scrollTable = (direction: "left" | "right") => {
    const el = tableContainerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -350 : 350;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = totalItems || services.length;
    const active = services.filter((s) => s.isActive !== false).length;
    const totalRate = services.reduce(
      (acc, s) => acc + (s.pricePerDay || 0),
      0,
    );
    const avgRate =
      services.length > 0 ? Math.round(totalRate / services.length) : 0;
    const uniqueCategories = new Set(services.map((s) => s.category)).size;

    return { total, active, avgRate, uniqueCategories };
  }, [services, totalItems]);

  // Server-paginated Services
  const filteredServices = services;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMode("all");
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedMode !== "all" ||
    sortBy !== "newest";

  if (isLoading || !isAdmin) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-24 pt-[100px] text-white sm:px-6 lg:px-8">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-indigo-500/[0.07] blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[580px] w-[580px] rounded-full bg-yellow-400/[0.04] blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[350px] -translate-x-1/2 rounded-full bg-blue-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-yellow-400">
                <Sparkles size={11} /> Admin Hub
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                Inventory & Catalog
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Manage Services
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Supercharge your offerings with real-time slot control, rate
              policies, and rich metadata
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchServices}
              disabled={loading}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              title="Refresh services"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              href="/admin/services/new"
              id="new-service-btn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 px-5 text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:from-yellow-300 hover:to-amber-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.25)]"
            >
              <Plus size={16} />
              Add Service
            </Link>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Services
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                <Layers size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {metrics.total}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-medium text-emerald-400">
                {metrics.active} active
              </span>
              <span>across platform</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Ratio
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-emerald-400 sm:text-3xl">
              {metrics.total > 0
                ? Math.round((metrics.active / metrics.total) * 100)
                : 0}
              %
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Live and bookable catalog
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Avg. Base Rate
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400">
                <IndianRupee size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-center text-2xl font-black text-white sm:text-3xl">
              <span className="text-yellow-400">₹</span>
              {formatPrice(metrics.avgRate)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Average listed price
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Categories
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-400/10 text-purple-400">
                <Tag size={16} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {metrics.uniqueCategories}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Distinct service verticals
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, location, tag, amenity..."
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-9 text-sm text-white placeholder-slate-500 transition-all focus:border-yellow-400/40 focus:bg-white/[0.07] focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setSelectedMode(e.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    setPage(1);
                  }}
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
                  onClick={() => setViewMode("table")}
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
                  onClick={() => setViewMode("grid")}
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
                  onClick={clearFilters}
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
              Showing{" "}
              <span className="font-bold text-white">
                {filteredServices.length}
              </span>{" "}
              of <span className="font-bold text-white">{services.length}</span>{" "}
              services
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
                    onClick={() => scrollTable("left")}
                    disabled={!canScrollLeft}
                    className="flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    title="Scroll left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => scrollTable("right")}
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

        {/* Content Body */}
        {loading ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />
            <p className="mt-4 text-xs font-medium text-slate-400">
              Loading rich service catalog...
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-6 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-3xl">
              🏛️
            </div>
            <h3 className="text-xl font-bold text-white">
              {services.length === 0
                ? "No services yet"
                : "No matching services"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              {services.length === 0
                ? "You haven't added any services yet. Create your first service to start listing it on the platform."
                : "No services found matching your current filter criteria. Try adjusting or resetting your filters."}
            </p>

            {services.length === 0 ? (
              <Link
                href="/admin/services/new"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-[#050d1e] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300"
              >
                <Plus size={16} />
                Add Your First Service
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-5 inline-flex cursor-pointer h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-xs font-semibold text-white transition-all hover:bg-white/10"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* LUXURY TABLE CONTAINER WITH SLEEK HORIZONTAL SCROLLBAR & STICKY COLUMN */
          <div className="relative rounded-2xl border border-white/[0.09] bg-[#071329]/70 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            {/* Left Scroll Indicator Shadow */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute bottom-0 left-[340px] top-0 z-30 w-8 bg-gradient-to-r from-[#050d1e]/80 to-transparent transition-opacity" />
            )}

            {/* Right Scroll Indicator Shadow & Glow */}
            {canScrollRight && (
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-30 flex w-12 items-center justify-end pr-2 bg-gradient-to-l from-[#050d1e]/90 to-transparent transition-opacity">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 backdrop-blur-md animate-pulse">
                  <ChevronRight size={14} />
                </span>
              </div>
            )}

            {/* Horizontal Scrollable Area */}
            <div
              ref={tableContainerRef}
              onScroll={updateScrollButtons}
              className="custom-scrollbar overflow-x-auto rounded-2xl pb-3"
            >
              <div className="min-w-[1320px]">
                {/* Table Header Row */}
                <div className="grid grid-cols-[340px_160px_160px_200px_170px_140px_150px] items-center border-b border-white/[0.08] bg-[#061125] text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {/* Sticky Header Column 1 */}
                  <div className="sticky left-0 z-20 flex items-center gap-2 border-r border-white/10 bg-[#061125] py-4 pl-6 pr-4 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
                    <span>Service Details & Media</span>
                  </div>

                  <div className="px-4 py-4">Category & Model</div>
                  <div className="px-4 py-4">Pricing & Policy</div>
                  <div className="px-4 py-4">Location & Contact</div>
                  <div className="px-4 py-4">Operating Window</div>
                  <div className="px-4 py-4">Rating & Status</div>
                  <div className="py-4 pl-4 pr-6 text-right">Actions</div>
                </div>

                {/* Table Body Rows */}
                <div className="divide-y divide-white/[0.06]">
                  {filteredServices.map((svc) => {
                    const isExpanded = !!expandedIds[svc._id];
                    const catInfo =
                      CATEGORY_MAP[svc.category] || CATEGORY_MAP.other;
                    const modeInfo =
                      BOOKING_MODE_MAP[svc.bookingMode || "date_range"] ||
                      BOOKING_MODE_MAP.date_range;
                    const cancelPolicy =
                      CANCELLATION_BADGE[
                        svc.cancellationPolicy || "Flexible"
                      ] || CANCELLATION_BADGE.Flexible;
                    const primaryImage = svc.images?.[0];
                    const unitLabel =
                      PRICING_UNIT_LABEL[svc.pricingUnit || "per_day"] ||
                      "per day";

                    return (
                      <div
                        key={svc._id}
                        id={`admin-service-${svc._id}`}
                        className="group transition-colors duration-150 hover:bg-white/[0.03]"
                      >
                        {/* Main Grid Row */}
                        <div className="grid grid-cols-[340px_160px_160px_200px_170px_140px_150px] items-center">
                          {/* STICKY COLUMN 1: Service Details & Media */}
                          <div className="sticky left-0 z-10 flex min-w-0 items-start gap-3.5 border-r border-white/10 bg-[#061125] py-4 pl-6 pr-4 shadow-[4px_0_12px_rgba(0,0,0,0.35)] transition-colors group-hover:bg-[#0a1a38]">
                            {/* Thumbnail with photo count badge */}
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-md">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage}
                                  alt={svc.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-2xl">
                                  {catInfo.icon}
                                </div>
                              )}
                              {svc.images && svc.images.length > 1 && (
                                <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                                  📷 {svc.images.length}
                                </span>
                              )}
                            </div>

                            {/* Title, tags, description */}
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/services/${svc._id}`}
                                className="block truncate text-[14px] font-bold text-white transition-colors hover:text-yellow-400"
                                title={svc.title}
                              >
                                {svc.title}
                              </Link>

                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                                {svc.description}
                              </p>

                              {/* Tags & Amenities pills */}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {svc.tags?.slice(0, 2).map((t, i) => (
                                  <span
                                    key={i}
                                    className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {svc.amenities && svc.amenities.length > 0 && (
                                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                                    {svc.amenities[0]}
                                    {svc.amenities.length > 1
                                      ? ` +${svc.amenities.length - 1}`
                                      : ""}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  {formatDate(svc.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* COLUMN 2: Category & Booking Model */}
                          <div className="space-y-1.5 px-4 py-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${catInfo.badgeClass}`}
                              >
                                <span>{catInfo.icon}</span>
                                {catInfo.label}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${modeInfo.badgeClass}`}
                              >
                                <span>{modeInfo.icon}</span>
                                {modeInfo.label}
                              </span>

                              {svc.bookingMode === "time_slot" && (
                                <span className="text-[11px] text-purple-300/80">
                                  ⚡ {svc.timeSlots?.length || 0} slots
                                </span>
                              )}

                              {svc.capacity && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <Users size={11} className="text-slate-500" />
                                  Cap: {svc.capacity} guests
                                </span>
                              )}
                            </div>
                          </div>

                          {/* COLUMN 3: Pricing & Policy */}
                          <div className="space-y-1.5 px-4 py-4">
                            <div>
                              <div className="flex items-center gap-0.5 text-base font-black text-yellow-400">
                                <IndianRupee size={15} />
                                <span>{formatPrice(svc.pricePerDay)}</span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">
                                / {unitLabel}
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cancelPolicy.badgeClass}`}
                              >
                                <Shield size={10} />
                                {cancelPolicy.label}
                              </span>
                            </div>
                          </div>

                          {/* COLUMN 4: Location & Contact */}
                          <div className="space-y-1 px-4 py-4 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 font-medium text-white">
                              <MapPin
                                size={13}
                                className="shrink-0 text-yellow-400"
                              />
                              <span className="truncate">
                                {svc.location.city}
                                {svc.location.state
                                  ? `, ${svc.location.state}`
                                  : ""}
                              </span>
                            </div>

                            {svc.location.address && (
                              <p className="line-clamp-1 text-[11px] text-slate-400">
                                {svc.location.address}
                              </p>
                            )}

                            {/* Quick Contact shortcuts */}
                            <div className="flex items-center gap-2 pt-1 text-slate-400">
                              {svc.contact?.phone && (
                                <a
                                  href={`tel:${svc.contact.phone}`}
                                  className="transition-colors hover:text-white"
                                  title={`Call ${svc.contact.phone}`}
                                >
                                  <Phone size={12} />
                                </a>
                              )}
                              {svc.contact?.email && (
                                <a
                                  href={`mailto:${svc.contact.email}`}
                                  className="transition-colors hover:text-white"
                                  title={`Email ${svc.contact.email}`}
                                >
                                  <Mail size={12} />
                                </a>
                              )}
                              {svc.contact?.website && (
                                <a
                                  href={svc.contact.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="transition-colors hover:text-white"
                                  title="Visit Website"
                                >
                                  <Globe size={12} />
                                </a>
                              )}
                              <span className="truncate text-[10px] text-slate-500 max-w-[130px]">
                                {svc.contact?.phone ||
                                  svc.contact?.email ||
                                  "No contact"}
                              </span>
                            </div>
                          </div>

                          {/* COLUMN 5: Operating Window */}
                          <div className="space-y-1 px-4 py-4 text-xs">
                            {svc.availableFrom || svc.availableTo ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                                  <Calendar
                                    size={12}
                                    className="text-slate-400"
                                  />
                                  <span>
                                    {formatDate(svc.availableFrom) || "Start"}
                                  </span>
                                </div>
                                <div className="pl-4 text-[11px] text-slate-400">
                                  to {formatDate(svc.availableTo) || "Ongoing"}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <Sparkles size={11} /> Always Available
                              </span>
                            )}

                            {svc.availability &&
                              svc.availability.length > 0 && (
                                <div className="text-[10px] text-slate-400">
                                  {
                                    svc.availability.filter((a) => a.isBooked)
                                      .length
                                  }{" "}
                                  booked blocks
                                </div>
                              )}
                          </div>

                          {/* COLUMN 6: Rating & Status */}
                          <div className="space-y-1.5 px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 rounded-md border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-xs font-bold text-yellow-400">
                                <Star size={12} className="fill-yellow-400" />
                                <span>
                                  {svc.rating ? svc.rating.toFixed(1) : "5.0"}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                ({svc.totalReviews || 0})
                              </span>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  svc.isActive !== false
                                    ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/25"
                                    : "bg-slate-500/15 text-slate-400 border border-slate-500/25"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    svc.isActive !== false
                                      ? "bg-emerald-400 animate-pulse"
                                      : "bg-slate-400"
                                  }`}
                                />
                                {svc.isActive !== false ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {/* COLUMN 7: Actions */}
                          <div className="flex items-center justify-end gap-1.5 py-4 pl-4 pr-6">
                            {/* View Live */}
                            <Link
                              href={`/services/${svc._id}`}
                              target="_blank"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-300"
                              title="View public page"
                            >
                              <ExternalLink size={13} />
                            </Link>

                            {/* Edit */}
                            <Link
                              href={`/admin/services/${svc._id}/edit`}
                              id={`edit-service-${svc._id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300"
                              title="Edit service"
                            >
                              <Edit2 size={13} />
                            </Link>

                            {/* Delete */}
                            <button
                              id={`delete-service-${svc._id}`}
                              onClick={() => handleDelete(svc._id, svc.title)}
                              disabled={deleting === svc._id}
                              className="inline-flex cursor-pointer h-8 w-8 items-center justify-center rounded-lg border border-red-400/15 bg-red-400/[0.06] text-red-400 transition-all hover:border-red-400/30 hover:bg-red-400/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete service"
                            >
                              <Trash2 size={13} />
                            </button>

                            {/* Expand toggle */}
                            <button
                              onClick={() => toggleExpand(svc._id)}
                              className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all ${
                                isExpanded
                                  ? "border-yellow-400/40 bg-yellow-400/15 text-yellow-400"
                                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                              }`}
                              title="Expand full details"
                            >
                              {isExpanded ? (
                                <ChevronUp size={15} />
                              ) : (
                                <ChevronDown size={15} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* EXPANDABLE DEEP DIVE ACCORDION */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.08] bg-black/30 p-6 backdrop-blur-md">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                              {/* Left: Complete Description & Amenities */}
                              <div className="space-y-4 lg:col-span-2">
                                <div>
                                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-400">
                                    <Info size={13} /> Full Description
                                  </h4>
                                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                    {svc.description}
                                  </p>
                                </div>

                                {/* Amenities List */}
                                {svc.amenities && svc.amenities.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Included Amenities ({svc.amenities.length}
                                      )
                                    </h4>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {svc.amenities.map((amenity, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200"
                                        >
                                          <CheckCircle2
                                            size={12}
                                            className="text-emerald-400"
                                          />
                                          {amenity}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Time Slots Preview (if applicable) */}
                                {svc.timeSlots && svc.timeSlots.length > 0 && (
                                  <div>
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                                      <Clock size={13} /> Configured Time Slots
                                      ({svc.timeSlots.length})
                                    </h4>
                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {svc.timeSlots.map((slot) => (
                                        <div
                                          key={slot._id}
                                          className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs"
                                        >
                                          <div>
                                            <span className="font-semibold text-white">
                                              {slot.label}
                                            </span>
                                            <div className="text-[11px] text-slate-400">
                                              {slot.startTime} – {slot.endTime}
                                            </div>
                                          </div>
                                          <span className="rounded bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                                            Max {slot.maxBookings} bookings
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Photo Gallery Strip */}
                                {svc.images && svc.images.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Service Gallery ({svc.images.length}{" "}
                                      images)
                                    </h4>
                                    <div className="mt-2 flex flex-wrap gap-3">
                                      {svc.images.map((imgUrl, i) => (
                                        <div
                                          key={i}
                                          className="relative h-20 w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-900"
                                        >
                                          <Image
                                            src={imgUrl}
                                            alt={`${svc.title} preview ${i + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="112px"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right: Contact & Quick Metadata Card */}
                              <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs">
                                <h4 className="font-bold uppercase tracking-wider text-slate-300">
                                  Contact & Location Details
                                </h4>

                                <div className="space-y-2 text-slate-300">
                                  <div className="flex items-start gap-2">
                                    <MapPin
                                      size={14}
                                      className="mt-0.5 shrink-0 text-yellow-400"
                                    />
                                    <div>
                                      <div className="font-semibold text-white">
                                        {svc.location.city},{" "}
                                        {svc.location.state}
                                      </div>
                                      <div className="text-slate-400">
                                        {svc.location.address ||
                                          "Address not specified"}
                                      </div>
                                    </div>
                                  </div>

                                  {svc.contact?.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone
                                        size={13}
                                        className="text-slate-400"
                                      />
                                      <span>{svc.contact.phone}</span>
                                    </div>
                                  )}

                                  {svc.contact?.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail
                                        size={13}
                                        className="text-slate-400"
                                      />
                                      <span>{svc.contact.email}</span>
                                    </div>
                                  )}

                                  {svc.contact?.website && (
                                    <div className="flex items-center gap-2">
                                      <Globe
                                        size={13}
                                        className="text-slate-400"
                                      />
                                      <a
                                        href={svc.contact.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-400 underline hover:text-blue-300"
                                      >
                                        {svc.contact.website}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1 border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
                                  <div>
                                    ID:{" "}
                                    <span className="font-mono text-slate-300">
                                      {svc._id}
                                    </span>
                                  </div>
                                  <div>
                                    Cancellation Policy:{" "}
                                    <span className="font-semibold text-white">
                                      {svc.cancellationPolicy || "Flexible"}
                                    </span>
                                  </div>
                                  {typeof svc.createdBy === "object" &&
                                    svc.createdBy?.name && (
                                      <div>
                                        Created by:{" "}
                                        <span className="text-white">
                                          {svc.createdBy.name}
                                        </span>
                                      </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                  <Link
                                    href={`/admin/services/${svc._id}/edit`}
                                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 text-xs font-bold text-[#050d1e] transition-all hover:bg-yellow-300"
                                  >
                                    <Edit2 size={13} />
                                    Edit Full Service
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((svc) => {
              const catInfo = CATEGORY_MAP[svc.category] || CATEGORY_MAP.other;
              const modeInfo =
                BOOKING_MODE_MAP[svc.bookingMode || "date_range"] ||
                BOOKING_MODE_MAP.date_range;
              const cancelPolicy =
                CANCELLATION_BADGE[svc.cancellationPolicy || "Flexible"] ||
                CANCELLATION_BADGE.Flexible;
              const primaryImage = svc.images?.[0];

              return (
                <div
                  key={svc._id}
                  id={`admin-service-${svc._id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-200 hover:border-yellow-400/25 hover:bg-white/[0.05] hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
                >
                  <div>
                    {/* Media Header */}
                    <div className="relative h-48 w-full bg-slate-900">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={svc.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          {catInfo.icon}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${catInfo.badgeClass}`}
                        >
                          {catInfo.icon} {catInfo.label}
                        </span>
                      </div>

                      <div className="absolute right-3 top-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                            svc.isActive !== false
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                              : "bg-slate-500/20 text-slate-300 border border-slate-400/30"
                          }`}
                        >
                          {svc.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-0.5 text-xl font-black text-yellow-400">
                            <IndianRupee size={18} />
                            {formatPrice(svc.pricePerDay)}
                          </div>
                          <span className="text-[11px] font-medium text-slate-300">
                            /{" "}
                            {PRICING_UNIT_LABEL[svc.pricingUnit || "per_day"] ||
                              "per day"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-yellow-400 backdrop-blur-sm">
                          <Star size={12} className="fill-yellow-400" />
                          <span>
                            {svc.rating ? svc.rating.toFixed(1) : "5.0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="line-clamp-1 text-lg font-bold text-white transition-colors group-hover:text-yellow-400">
                        {svc.title}
                      </h3>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {svc.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${modeInfo.badgeClass}`}
                        >
                          {modeInfo.icon} {modeInfo.label}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cancelPolicy.badgeClass}`}
                        >
                          <Shield size={10} />
                          {cancelPolicy.label}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-300">
                        <MapPin
                          size={13}
                          className="shrink-0 text-yellow-400"
                        />
                        <span className="truncate">
                          {svc.location.city}
                          {svc.location.state ? `, ${svc.location.state}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-5 py-3.5">
                    <Link
                      href={`/services/${svc._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
                    >
                      <ExternalLink size={13} />
                      Live View
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/services/${svc._id}/edit`}
                        id={`edit-service-${svc._id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
                      >
                        <Edit2 size={12} />
                        Edit
                      </Link>

                      <button
                        id={`delete-service-${svc._id}`}
                        onClick={() => handleDelete(svc._id, svc.title)}
                        disabled={deleting === svc._id}
                        className="inline-flex h-8 items-center cursor-pointer gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-400/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-3.5 backdrop-blur-xl sm:flex-row">
            <span className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-white">
                {(page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-white">
                {Math.min(page * limit, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-white">{totalItems}</span>{" "}
              services
            </span>

            <div className="flex items-center gap-2">
              <button
                id="admin-services-prev-btn"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <div className="rounded-xl border border-white/[0.08] bg-[#071329] px-3 py-1.5 text-xs text-slate-300">
                Page <span className="font-bold text-white">{page}</span> of{" "}
                <span className="font-bold text-white">{totalPages}</span>
              </div>

              <button
                id="admin-services-next-btn"
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
