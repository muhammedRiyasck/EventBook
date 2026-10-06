'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, MapPin, IndianRupee, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Booking, Service } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

type TabType = 'all' | 'upcoming' | 'past';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'badge-confirmed', pending: 'badge-pending',
  cancelled: 'badge-cancelled', completed: 'badge-completed',
};

export default function BookingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  const fetchBookings = async (tab: TabType) => {
    setLoading(true);
    try {
      const params = tab !== 'all' ? `?type=${tab}` : '';
      const { data } = await api.get(`/bookings/my${params}`);
      setBookings(data.data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchBookings(activeTab);
  }, [activeTab, isAuthenticated]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      fetchBookings(activeTab);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isLoading) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">My Bookings</h1>
          <Link href="/services" className="btn btn-primary btn-sm" id="find-services-btn">
            Find Services
          </Link>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['all', 'upcoming', 'past'] as TabType[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={48} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No bookings yet</h3>
            <p>{activeTab === 'upcoming' ? 'You have no upcoming bookings' : activeTab === 'past' ? 'No past bookings found' : "You haven't made any bookings yet"}</p>
            <Link href="/services" className="btn btn-primary" style={{ marginTop: 24 }}>
              Browse Services
            </Link>
          </div>
        ) : (
          <div className={styles.bookingsList}>
            {bookings.map((booking) => {
              const svc = booking.service as Service;
              const isActive = booking.status === 'confirmed' || booking.status === 'pending';
              return (
                <div key={booking._id} className={styles.bookingCard} id={`booking-${booking._id}`}>
                  <div className={styles.bookingHeader}>
                    <div>
                      <h3 className={styles.serviceTitle}>
                        {typeof svc === 'object' ? svc.title : 'Service'}
                      </h3>
                      {typeof svc === 'object' && (
                        <div className={styles.serviceLocation}>
                          <MapPin size={12} /> {svc.location?.city}, {svc.location?.state}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className={styles.bookingMeta}>
                    <div className={styles.metaItem}>
                      <CalendarDays size={14} />
                      <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span style={{ color: 'var(--slate-500)' }}>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className={styles.bookingFooter}>
                    <div className={styles.totalPrice}>
                      <IndianRupee size={14} />
                      <span>{new Intl.NumberFormat('en-IN').format(booking.totalPrice)}</span>
                    </div>
                    {isActive && (
                      <button
                        id={`cancel-booking-${booking._id}`}
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelling === booking._id}
                      >
                        <X size={14} />
                        {cancelling === booking._id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>

                  {booking.notes && (
                    <p className={styles.notes}>📝 {booking.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
