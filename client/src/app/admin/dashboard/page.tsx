'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Layers, CalendarDays, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface Stats { totalServices: number; totalBookings: number; confirmedBookings: number; cancelledBookings: number; }

export default function AdminDashboardPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalServices: 0, totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && !isAdmin) router.push('/dashboard');
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [svcRes, bkRes] = await Promise.all([
          api.get('/services?limit=1'),
          api.get('/bookings?limit=1'),
        ]);
        const confirmedRes = await api.get('/bookings?limit=1&status=confirmed');
        const cancelledRes = await api.get('/bookings?limit=1&status=cancelled');
        setStats({
          totalServices: svcRes.data.pagination?.totalItems || 0,
          totalBookings: bkRes.data.pagination?.totalItems || 0,
          confirmedBookings: confirmedRes.data.pagination?.totalItems || 0,
          cancelledBookings: cancelledRes.data.pagination?.totalItems || 0,
        });
      } catch {
        // Stats failed silently
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  if (isLoading || !isAdmin) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  const STAT_CARDS = [
    { icon: <Layers size={22} />, label: 'Total Services', value: stats.totalServices, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { icon: <CalendarDays size={22} />, label: 'Total Bookings', value: stats.totalBookings, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: <TrendingUp size={22} />, label: 'Confirmed', value: stats.confirmedBookings, color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
    { icon: <LayoutDashboard size={22} />, label: 'Cancelled', value: stats.cancelledBookings, color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className={`glow-dot ${styles.blob}`} />
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p style={{ color: 'var(--slate-400)', marginTop: 8 }}>Overview of your EventBook platform</p>
          </div>
          <Link href="/admin/services/new" className="btn btn-primary" id="add-service-btn">
            + Add Service
          </Link>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className={styles.statValue}>{loading ? '—' : card.value}</div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <h2 className={styles.sectionTitle}>Manage</h2>
        <div className={styles.navCards}>
          <Link href="/admin/services" className={styles.navCard} id="admin-services-link">
            <div className={styles.navIcon}><Layers size={24} /></div>
            <div>
              <h3 className={styles.navTitle}>Services</h3>
              <p className={styles.navDesc}>Add, edit, or remove services</p>
            </div>
          </Link>
          <Link href="/admin/bookings" className={styles.navCard} id="admin-bookings-link">
            <div className={styles.navIcon} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><CalendarDays size={24} /></div>
            <div>
              <h3 className={styles.navTitle}>Bookings</h3>
              <p className={styles.navDesc}>View and manage all bookings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
