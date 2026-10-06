'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MapPin, Phone, Mail, Globe, Star, IndianRupee,
  CalendarDays, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';
import { Service } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const CATEGORY_ICONS: Record<string, string> = {
  venue: '🏛️', hotel: '🏨', caterer: '🍽️',
  cameraman: '📷', dj: '🎧', decorator: '🌸', other: '✨',
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/services/${id}`);
        setService(data.data);
      } catch {
        toast.error('Service not found');
        router.push('/services');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, router]);

  // Calculate total
  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalPrice = service ? totalDays * service.pricePerDay : 0;

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a service');
      router.push('/login');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    setBooking(true);
    try {
      await api.post('/bookings', {
        serviceId: id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes,
      });
      toast.success('🎉 Booking confirmed! Check your email.');
      router.push('/bookings');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!service) return null;

  const images = service.images?.length ? service.images : [];
  const formattedPrice = new Intl.NumberFormat('en-IN').format(service.pricePerDay);

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className="container">
        {/* Breadcrumb */}
        <Link href="/services" className={styles.back}>
          <ChevronLeft size={16} /> Back to Services
        </Link>

        <div className={styles.layout}>
          {/* ─── Left: Details ───────────────────────────── */}
          <div className={styles.details}>
            {/* Image Gallery */}
            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                {images.length > 0 ? (
                  <Image src={images[activeImage]} alt={service.title} fill className={styles.mainImg} sizes="(max-width: 768px) 100vw, 60vw" />
                ) : (
                  <div className={styles.noImage}>
                    <span style={{ fontSize: 72 }}>{CATEGORY_ICONS[service.category]}</span>
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button className={`${styles.galleryBtn} ${styles.galleryBtnLeft}`}
                      onClick={() => setActiveImage((p) => (p - 1 + images.length) % images.length)}>
                      <ChevronLeft size={20} />
                    </button>
                    <button className={`${styles.galleryBtn} ${styles.galleryBtnRight}`}
                      onClick={() => setActiveImage((p) => (p + 1) % images.length)}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className={styles.thumbnails}>
                  {images.map((img, i) => (
                    <button key={i} className={`${styles.thumbnail} ${i === activeImage ? styles.thumbnailActive : ''}`}
                      onClick={() => setActiveImage(i)}>
                      <Image src={img} alt={`${service.title} ${i + 1}`} fill sizes="80px" style={{ objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.infoHeader}>
                <span className={`badge badge-${service.category}`}>
                  {CATEGORY_ICONS[service.category]} {service.category}
                </span>
                {service.rating > 0 && (
                  <div className={styles.rating}>
                    <Star size={14} fill="currentColor" />
                    <span>{service.rating.toFixed(1)}</span>
                    <span style={{ color: 'var(--slate-500)' }}>({service.totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              <h1 className={styles.serviceTitle}>{service.title}</h1>

              <div className={styles.location}>
                <MapPin size={14} />
                <span>{service.location.address}, {service.location.city}, {service.location.state}</span>
              </div>

              <p className={styles.description}>{service.description}</p>

              {service.tags?.length > 0 && (
                <div className={styles.tags}>
                  {service.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Contact */}
              <div className={styles.contactCard}>
                <h3 className={styles.contactTitle}>Contact Information</h3>
                <div className={styles.contactItems}>
                  <a href={`tel:${service.contact.phone}`} className={styles.contactItem}>
                    <Phone size={15} /> {service.contact.phone}
                  </a>
                  <a href={`mailto:${service.contact.email}`} className={styles.contactItem}>
                    <Mail size={15} /> {service.contact.email}
                  </a>
                  {service.contact.website && (
                    <a href={service.contact.website} target="_blank" rel="noreferrer" className={styles.contactItem}>
                      <Globe size={15} /> {service.contact.website}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Booking Card ─────────────────────── */}
          <div className={styles.bookingCard}>
            <div className={styles.priceHeader}>
              <div className={styles.price}>
                <IndianRupee size={20} />
                <span className={styles.priceAmount}>{formattedPrice}</span>
              </div>
              <span className={styles.priceUnit}>per day</span>
            </div>

            <div className="divider" />

            <div className={styles.dateSection}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => { setStartDate(date); if (endDate && date && date >= endDate) setEndDate(null); }}
                  minDate={new Date()}
                  placeholderText="Select start date"
                  className="form-input"
                  dateFormat="dd MMM yyyy"
                  id="start-date-picker"
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  minDate={startDate ? new Date(startDate.getTime() + 86400000) : new Date()}
                  placeholderText="Select end date"
                  className="form-input"
                  dateFormat="dd MMM yyyy"
                  id="end-date-picker"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className={styles.priceSummary}>
                <div className={styles.summaryRow}>
                  <span>₹{formattedPrice} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                  <span>₹{new Intl.NumberFormat('en-IN').format(totalPrice)}</span>
                </div>
                <div className="divider" />
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <span className={styles.totalAmount}>₹{new Intl.NumberFormat('en-IN').format(totalPrice)}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Special Requests (optional)</label>
              <textarea
                className="form-input"
                placeholder="Any special requirements or notes…"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                id="booking-notes"
              />
            </div>

            <button
              id="book-now-btn"
              className={`btn btn-primary ${styles.bookBtn}`}
              onClick={handleBook}
              disabled={booking || !startDate || !endDate}
            >
              {booking ? (
                <><span className={styles.smallSpinner} /> Processing…</>
              ) : (
                <><CalendarDays size={18} /> {isAuthenticated ? 'Confirm Booking' : 'Sign In to Book'}</>
              )}
            </button>

            {!isAuthenticated && (
              <div className={styles.loginHint}>
                <AlertCircle size={14} />
                <span>You need to be signed in to make a booking</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
