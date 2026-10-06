'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Search, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAdmin) router.push('/admin/dashboard');
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !user) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className={`glow-dot ${styles.blob}`} />
      <div className="container">
        {/* Welcome */}
        <div className={styles.welcome}>
          <div className={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.welcomeTitle}>
              Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span>! 👋
            </h1>
            <p style={{ color: 'var(--slate-400)', fontSize: 15 }}>
              {user.email} · {user.phone || 'No phone added'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/services" className={styles.actionCard} id="dashboard-browse-btn">
            <div className={styles.actionIcon} style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold-400)' }}>
              <Search size={24} />
            </div>
            <div>
              <h3 className={styles.actionTitle}>Browse Services</h3>
              <p className={styles.actionDesc}>Search and book event services</p>
            </div>
            <ArrowRight size={18} className={styles.actionArrow} />
          </Link>

          <Link href="/bookings" className={styles.actionCard} id="dashboard-bookings-btn">
            <div className={styles.actionIcon} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className={styles.actionTitle}>My Bookings</h3>
              <p className={styles.actionDesc}>View and manage your bookings</p>
            </div>
            <ArrowRight size={18} className={styles.actionArrow} />
          </Link>

          <div className={styles.actionCard} style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <div className={styles.actionIcon} style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
              <User size={24} />
            </div>
            <div>
              <h3 className={styles.actionTitle}>My Profile</h3>
              <p className={styles.actionDesc}>Update your account details</p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--slate-600)', marginLeft: 'auto' }}>Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
