import Link from 'next/link';
import { ArrowRight, Star, Shield, Clock, Users } from 'lucide-react';
import styles from './page.module.css';

const CATEGORIES = [
  { icon: '🏛️', label: 'Venues',      slug: 'venue',     count: '200+' },
  { icon: '🏨', label: 'Hotels',       slug: 'hotel',     count: '150+' },
  { icon: '🍽️', label: 'Caterers',    slug: 'caterer',   count: '300+' },
  { icon: '📷', label: 'Cameramen',   slug: 'cameraman', count: '180+' },
  { icon: '🎧', label: 'DJs',         slug: 'dj',        count: '120+' },
  { icon: '🌸', label: 'Decorators',  slug: 'decorator', count: '250+' },
];

const STATS = [
  { icon: <Users size={20} />, value: '10,000+', label: 'Happy Customers' },
  { icon: <Star size={20} />,  value: '4.9',     label: 'Average Rating' },
  { icon: <Shield size={20} />,value: '100%',    label: 'Secure Bookings' },
  { icon: <Clock size={20} />, value: '24/7',    label: 'Support Available' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        {/* Background glow blobs */}
        <div className={`glow-dot ${styles.blob1}`} />
        <div className={`glow-dot ${styles.blob2}`} />

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            <Star size={12} fill="currentColor" />
            <span>India&apos;s #1 Event Booking Platform</span>
          </div>

          <h1 className={`section-title ${styles.heroTitle}`}>
            Book the Perfect<br />
            <span className="gradient-text">Event Services</span><br />
            For Your Big Day
          </h1>

          <p className={styles.heroSubtitle}>
            Discover and book premium venues, caterers, DJs, decorators, cameramen &amp; more —
            all in one place. Make your event unforgettable.
          </p>

          <div className={styles.heroCta}>
            <Link href="/services" className="btn btn-primary btn-lg" id="hero-browse-btn">
              Explore Services <ArrowRight size={18} />
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg" id="hero-signup-btn">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─────────────────────────────────────────────────── */}
      <section className={`section ${styles.categoriesSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">
              Find every service you need for your perfect event, all in one platform.
            </p>
          </div>

          <div className={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services?category=${cat.slug}`}
                className={styles.categoryCard}
                id={`category-${cat.slug}`}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <h3 className={styles.categoryLabel}>{cat.label}</h3>
                <p className={styles.categoryCount}>{cat.count} listings</p>
                <ArrowRight size={16} className={styles.categoryArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ────────────────────────────────────────────────── */}
      <section className={`section ${styles.howSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Book your dream event service in 3 simple steps.</p>
          </div>

          <div className={styles.stepsGrid}>
            {[
              { step: '01', title: 'Search & Filter', desc: 'Browse hundreds of services. Filter by category, location, price, and dates to find exactly what you need.' },
              { step: '02', title: 'View & Compare', desc: 'See detailed descriptions, photos, pricing, and availability. Compare services side by side.' },
              { step: '03', title: 'Book Instantly', desc: 'Select your dates, confirm your booking, and receive an instant confirmation email.' },
            ].map((item) => (
              <div key={item.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={`glow-dot ${styles.ctaBlob}`} />
            <h2 className={`section-title ${styles.ctaTitle}`}>
              Ready to Plan Your<br /><span className="gradient-text">Dream Event?</span>
            </h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of happy customers who trust EventBook for their special occasions.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/services" className="btn btn-primary btn-lg" id="cta-browse-btn">
                Browse All Services <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>Event<span style={{ color: 'var(--gold-400)' }}>Book</span></span>
              <p>India&apos;s premium event services booking platform.</p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/services">Browse Services</Link>
              <Link href="/register">Sign Up</Link>
              <Link href="/login">Sign In</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 EventBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
