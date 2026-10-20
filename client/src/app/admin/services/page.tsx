"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminServices } from "@/hooks/useAdminServices";
import { ServicesMetrics } from "@/components/admin/services/ServicesMetrics";
import { ServicesFilterBar } from "@/components/admin/services/ServicesFilterBar";
import { ServicesTable } from "@/components/admin/services/ServicesTable";
import { ServicesGrid } from "@/components/admin/services/ServicesGrid";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AdminServicesPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const {
    services,
    loading,
    deleting,
    page,
    setPage,
    limit,
    totalPages,
    totalItems,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedMode,
    setSelectedMode,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    expandedIds,
    toggleExpand,
    fetchServices,
    handleDelete,
    metrics,
    clearFilters,
    hasActiveFilters,
  } = useAdminServices(isAdmin);

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

  if (isLoading || !isAdmin) {
    return <LoadingState fullPage />;
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
              Supercharge your offerings with real-time slot control, rate policies, and rich metadata
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
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
        <ServicesMetrics metrics={metrics} />

        {/* Filter and Search Bar */}
        <ServicesFilterBar
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          selectedCategory={selectedCategory}
          onCategoryChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
          selectedMode={selectedMode}
          onModeChange={(val) => {
            setSelectedMode(val);
            setPage(1);
          }}
          sortBy={sortBy}
          onSortChange={(val) => {
            setSortBy(val);
            setPage(1);
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filteredCount={services.length}
          totalCount={totalItems}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollTable={scrollTable}
        />

        {/* Content Body */}
        {loading ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />
            <p className="mt-4 text-xs font-medium text-slate-400">
              Loading rich service catalog...
            </p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-6 text-center backdrop-blur-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] text-3xl">
              🏛️
            </div>
            <h3 className="text-xl font-bold text-white">
              {totalItems === 0 ? "No services yet" : "No matching services"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              {totalItems === 0
                ? "You haven't added any services yet. Create your first service to start listing it on the platform."
                : "No services found matching your current filter criteria. Try adjusting or resetting your filters."}
            </p>

            {totalItems === 0 ? (
              <Link
                href="/admin/services/new"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-[#050d1e] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300"
              >
                <Plus size={16} />
                Add Your First Service
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex cursor-pointer h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-xs font-semibold text-white transition-all hover:bg-white/10"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <ServicesTable
            services={services}
            deleting={deleting}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            tableContainerRef={tableContainerRef}
            onScroll={updateScrollButtons}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
          />
        ) : (
          <ServicesGrid
            services={services}
            deleting={deleting}
            onDelete={handleDelete}
          />
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
