'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, CalendarDays, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.inner} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <CalendarDays size={22} className={styles.logoIcon} />
          <span>Event<span className={styles.logoAccent}>Book</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.links}>
          <Link href="/services" className={`${styles.link} ${pathname.startsWith('/services') ? styles.active : ''}`}>
            Browse Services
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link href="/bookings" className={`${styles.link} ${pathname === '/bookings' ? styles.active : ''}`}>
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className={`${styles.link} ${pathname.startsWith('/admin') ? styles.active : ''}`}>
              Admin Panel
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className={styles.auth}>
          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userBtn}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="user-menu-btn"
              >
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user?.name}</p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                    <span className={`badge ${isAdmin ? 'badge-info' : ''}`} style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', fontSize: '11px' }}>
                      {user?.role}
                    </span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  {isAdmin ? (
                    <>
                      <Link href="/admin/dashboard" className={styles.dropdownItem}>
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link href="/admin/services" className={styles.dropdownItem}>
                        <Settings size={15} /> Manage Services
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard" className={styles.dropdownItem}>
                        <User size={15} /> Dashboard
                      </Link>
                      <Link href="/bookings" className={styles.dropdownItem}>
                        <CalendarDays size={15} /> My Bookings
                      </Link>
                    </>
                  )}
                  <div className={styles.dropdownDivider} />
                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={logout}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className={styles.mobileToggle} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/services" className={styles.mobileLink}>Browse Services</Link>
          {isAuthenticated && !isAdmin && (
            <Link href="/bookings" className={styles.mobileLink}>My Bookings</Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className={styles.mobileLink}>Admin Panel</Link>
          )}
          <div className={styles.mobileDivider} />
          {isAuthenticated ? (
            <button className={styles.mobileLink} onClick={logout} style={{ textAlign: 'left', width: '100%', background: 'none', color: '#ef4444' }}>
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" className={styles.mobileLink}>Sign In</Link>
              <Link href="/register" className={`${styles.mobileLink} ${styles.mobileLinkGold}`}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
