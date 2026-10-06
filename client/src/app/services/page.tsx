'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Service, Pagination, ServiceFilters } from '@/types';
import ServiceCard from '@/components/services/ServiceCard';
import styles from './page.module.css';

const CATEGORIES = ['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'pricePerDay_asc', label: 'Price: Low to High' },
  { value: 'pricePerDay_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Top Rated' },
];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ServiceFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  });

  const fetchServices = useCallback(async (f: ServiceFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/services?${params.toString()}`);
      setServices(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices(filters);
  }, [filters, fetchServices]);

  const updateFilter = (key: keyof ServiceFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? '1' : value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', city: '', minPrice: '', maxPrice: '', sort: 'newest', page: '1' });
  };

  const hasActiveFilters = filters.category || filters.city || filters.minPrice || filters.maxPrice;

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className="container">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className="section-title">Browse Services</h1>
            <p className="section-subtitle" style={{ marginTop: 8 }}>
              {pagination ? `${pagination.totalItems} services found` : 'Discover event services near you'}
            </p>
          </div>
        </div>

        {/* ─── Search + Controls ───────────────────────────────── */}
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              id="service-search"
              type="text"
              className={`form-input ${styles.searchInput}`}
              placeholder="Search venues, caterers, DJs…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
            {filters.search && (
              <button className={styles.clearSearch} onClick={() => updateFilter('search', '')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            id="sort-select"
            className={`form-input ${styles.sortSelect}`}
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            id="filter-toggle-btn"
            className={`btn btn-secondary ${showFilters ? styles.filterBtnActive : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && <span className={styles.filterDot} />}
          </button>
        </div>

        {/* ─── Expandable Filters ──────────────────────────────── */}
        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filtersGrid}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select id="category-filter" className="form-input" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c} className={styles.capitalize}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input id="city-filter" type="text" className="form-input" placeholder="e.g. Mumbai, Delhi"
                  value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Min Price (₹/day)</label>
                <input id="min-price-filter" type="number" className="form-input" placeholder="0"
                  value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} min="0" />
              </div>

              <div className="form-group">
                <label className="form-label">Max Price (₹/day)</label>
                <input id="max-price-filter" type="number" className="form-input" placeholder="No limit"
                  value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} min="0" />
              </div>
            </div>

            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} id="clear-filters-btn">
                <X size={14} /> Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* ─── Results ─────────────────────────────────────────── */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonImage}`} />
                <div className={styles.skeletonContent}>
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '70%' }} />
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '50%', height: 12 }} />
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '90%', height: 12 }} />
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: 20, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No services found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}

        {/* ─── Pagination ───────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              id="prev-page-btn"
              className="btn btn-secondary btn-sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => updateFilter('page', String(pagination.currentPage - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className={styles.pageInfo}>
              Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
            </div>

            <button
              id="next-page-btn"
              className="btn btn-secondary btn-sm"
              disabled={!pagination.hasNextPage}
              onClick={() => updateFilter('page', String(pagination.currentPage + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
