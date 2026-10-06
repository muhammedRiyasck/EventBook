import Link from "next/link";
import { ArrowRight, Star, Shield, Clock, Users } from "lucide-react";

const CATEGORIES = [
  { icon: "🏛️", label: "Venues", slug: "venue", count: "200+" },
  { icon: "🏨", label: "Hotels", slug: "hotel", count: "150+" },
  { icon: "🍽️", label: "Caterers", slug: "caterer", count: "300+" },
  { icon: "📷", label: "Cameramen", slug: "cameraman", count: "180+" },
  { icon: "🎧", label: "DJs", slug: "dj", count: "120+" },
  { icon: "🌸", label: "Decorators", slug: "decorator", count: "250+" },
];

const STATS = [
  { icon: <Users size={20} />, value: "10,000+", label: "Happy Customers" },
  { icon: <Star size={20} />, value: "4.9", label: "Average Rating" },
  { icon: <Shield size={20} />, value: "100%", label: "Secure Bookings" },
  { icon: <Clock size={20} />, value: "24/7", label: "Support Available" },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(26,50,105,0.4)_0%,transparent_70%)] overflow-hidden">
        {/* Background glow blobs */}
        <div className="glow-dot w-[600px] h-[600px] bg-[rgba(26,50,105,0.5)] -top-[200px] -right-[100px]" />
        <div className="glow-dot w-[400px] h-[400px] bg-[#ffd700]/5 bottom-0 -left-[100px]" />

        <div className="container relative z-10 pt-[120px] pb-[80px] max-w-[720px]">
          <div className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-[#ffd700]/10 border border-[#ffd700]/25 rounded-full text-[13px] font-semibold text-[var(--gold-400)] mb-6 animate-[fadeInUp_0.5s_ease]">
            <Star size={12} fill="currentColor" />
            <span>India&apos;s #1 Event Booking Platform</span>
          </div>

          <h1 className="section-title text-[clamp(36px,6vw,68px)] leading-[1.1] mb-5 animate-[fadeInUp_0.5s_0.1s_ease_both]">
            Book the Perfect
            <br />
            <span className="gradient-text">Event Services</span>
            <br />
            For Your Big Day
          </h1>

          <p className="text-[clamp(15px,2vw,18px)] text-slate-400 max-w-[500px] leading-[1.7] mb-10 animate-[fadeInUp_0.5s_0.2s_ease_both]">
            Discover and book premium venues, caterers, DJs, decorators,
            cameramen &amp; more — all in one place. Make your event
            unforgettable.
          </p>

          <div className="flex gap-3.5 flex-wrap animate-[fadeInUp_0.5s_0.3s_ease_both]">
            <Link
              href="/services"
              className="btn btn-primary btn-lg"
              id="hero-browse-btn"
            >
              Explore Services <ArrowRight size={18} />
            </Link>
            <Link
              href="/register"
              className="btn btn-secondary btn-lg cursor-pointer"
              id="hero-signup-btn"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-[60px] border-y border-white/10 bg-white/5">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <div className="text-[var(--gold-400)] mb-1">{stat.icon}</div>
                <div className="font-display text-[32px] font-extrabold text-white leading-none">
                  {stat.value}
                </div>
                <div className="text-[13px] text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─────────────────────────────────────────────────── */}
      <section className="section bg-slate-950">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">
              Find every service you need for your perfect event, all in one
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services?category=${cat.slug}`}
                className="relative flex flex-col items-start gap-1.5 py-7 px-6 bg-white/5 border border-white/10 rounded-lg transition-all duration-250 ease-out overflow-hidden group hover:border-[#ffd700]/30 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                id={`category-${cat.slug}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/5 to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />
                <span className="text-[36px] mb-1 relative z-10">
                  {cat.icon}
                </span>
                <h3 className="text-[17px] font-bold text-white relative z-10">
                  {cat.label}
                </h3>
                <p className="text-[13px] text-slate-400 relative z-10">
                  {cat.count} listings
                </p>
                <ArrowRight
                  size={16}
                  className="absolute right-5 top-1/2 -translate-y-1/2 -translate-x-2 opacity-0 text-[var(--gold-400)] transition-all duration-250 group-hover:opacity-100 group-hover:translate-x-0 z-10"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ────────────────────────────────────────────────── */}
      <section className="section bg-gradient-to-b from-slate-950 to-[#0f1c3f]/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Book your dream event service in 3 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {[
              {
                step: "01",
                title: "Search & Filter",
                desc: "Browse hundreds of services. Filter by category, location, price, and dates to find exactly what you need.",
              },
              {
                step: "02",
                title: "View & Compare",
                desc: "See detailed descriptions, photos, pricing, and availability. Compare services side by side.",
              },
              {
                step: "03",
                title: "Book Instantly",
                desc: "Select your dates, confirm your booking, and receive an instant confirmation email.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="py-8 px-7 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="font-display text-[48px] font-black text-[var(--gold-400)] opacity-15 leading-none mb-4">
                  {item.step}
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2.5">
                  {item.title}
                </h3>
                <p className="text-[14px] text-slate-400 leading-[1.7]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="section bg-slate-950">
        <div className="container">
          <div className="relative text-center py-20 px-10 bg-gradient-to-br from-[#0f1c3f]/80 to-[#1a3269]/40 border border-[#ffd700]/15 rounded-xl overflow-hidden">
            <div className="glow-dot w-[500px] h-[500px] bg-[#ffd700]/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <h2 className="section-title mb-4 relative z-10">
              Ready to Plan Your
              <br />
              <span className="gradient-text">Dream Event?</span>
            </h2>
            <p className="text-slate-400 text-[16px] mb-9 relative z-10">
              Join thousands of happy customers who trust EventBook for their
              special occasions.
            </p>
            <div className="flex justify-center gap-3.5 flex-wrap relative z-10">
              <Link
                href="/services"
                className="btn btn-primary btn-lg"
                id="cta-browse-btn"
              >
                Browse All Services <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="pt-12 pb-8 border-t border-white/10">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-8">
            <div className="max-w-[280px]">
              <span className="font-display text-[22px] font-extrabold text-white">
                Event<span className="text-[var(--gold-400)]">Book</span>
              </span>
              <p className="mt-2 text-[14px] text-slate-500">
                India&apos;s premium event services booking platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/services"
                className="text-[14px] text-slate-400 transition-colors duration-200 text-white hover:text-[var(--gold-400)]"
              >
                Browse Services
              </Link>
              <Link
                href="/register"
                className="text-[14px] text-slate-400 transition-colors duration-200 hover:text-[var(--gold-400)]"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="text-[14px] text-slate-400 transition-colors duration-200 hover:text-[var(--gold-400)]"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-[13px] text-slate-600 text-center">
            <p>© 2024 EventBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
