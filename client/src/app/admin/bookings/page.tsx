'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, MapPin, IndianRupee, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Booking, Service, User as UserType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed'];

export default function AdminBookingsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && !isAdmin) router.push('/dashboard');
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchBookings = async (pg = 1, status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '15' });
      if (status) params.set('status', status);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      setBookings(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBookings(page, statusFilter);
  }, [isAdmin, page, statusFilter]);

  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status: status as Booking['status'] } : b));
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const STATUS_BADGE: Record<string, string> = {
    confirmed: 'badge-confirmed', pending: 'badge-pending',
    cancelled: 'badge-cancelled', completed: 'badge-completed',
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">All Bookings</h1>
          <select
            id="status-filter"
            className={`form-input ${styles.statusFilter}`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={48} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No bookings found</h3>
            <p>Bookings will appear here once users start booking services.</p>
          </div>
        ) : (
          <>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Booking ID</span>
                <span>User</span>
                <span>Service</span>
                <span>Dates</span>
                <span>Total</span>
                <span>Status</span>
              </div>

              {bookings.map((booking) => {
                const user = booking.user as UserType;
                const svc = booking.service as Service;
                return (
                  <div key={booking._id} className={styles.tableRow} id={`admin-booking-${booking._id}`}>
                    <div className={styles.bookingId}>#{booking._id.slice(-6).toUpperCase()}</div>

                    <div className={styles.userInfo}>
                      <User size={13} />
                      <div>
                        <div className={styles.userName}>{typeof user === 'object' ? user.name : 'User'}</div>
                        <div className={styles.userEmail}>{typeof user === 'object' ? user.email : ''}</div>
                      </div>
                    </div>

                    <div className={styles.serviceName}>
                      {typeof svc === 'object' ? svc.title : 'Service'}
                      {typeof svc === 'object' && (
                        <div className={styles.serviceLocation}>
                          <MapPin size={11} /> {svc.location?.city}
                        </div>
                      )}
                    </div>

                    <div className={styles.dates}>
                      <CalendarDays size={12} />
                      <span>{formatDate(booking.startDate)}</span>
                      <span style={{ color: 'var(--slate-600)' }}>→</span>
                      <span>{formatDate(booking.endDate)}</span>
                    </div>

                    <div className={styles.total}>
                      <IndianRupee size={13} />
                      {new Intl.NumberFormat('en-IN').format(booking.totalPrice)}
                    </div>

                    <div className={styles.statusCell}>
                      <select
                        id={`status-select-${booking._id}`}
                        className={`form-input ${styles.statusSelect}`}
                        value={booking.status}
                        onChange={(e) => updateStatus(booking._id, e.target.value)}
                        disabled={updatingId === booking._id}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <span className={`badge ${STATUS_BADGE[booking.status]}`}>{booking.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} id="admin-prev-page">
                  ← Previous
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} id="admin-next-page">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
