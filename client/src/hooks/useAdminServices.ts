"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Service } from "@/types";

export type SortByOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "title";

export function useAdminServices(isAdmin: boolean) {
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
  const [sortBy, setSortBy] = useState<SortByOption>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

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

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = totalItems || services.length;
    const now = Date.now();
    const active = services.filter(
      (s) =>
        s.isActive !== false &&
        (!s.availableTo ||
          new Date(s.availableTo).setHours(23, 59, 59, 999) >= now)
    ).length;
    const totalRate = services.reduce(
      (acc, s) => acc + (s.pricePerDay || 0),
      0
    );
    const avgRate =
      services.length > 0 ? Math.round(totalRate / services.length) : 0;
    const uniqueCategories = new Set(services.map((s) => s.category)).size;

    return { total, active, avgRate, uniqueCategories };
  }, [services, totalItems]);

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

  return {
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
  };
}
