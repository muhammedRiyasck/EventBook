import Link from "next/link";
import {
  ArrowRight,
  Star,
  Shield,
  CalendarDays,
  Search,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  { icon: "🏛️", label: "Venues", slug: "venue", count: "200+" },
  { icon: "🏨", label: "Hotels", slug: "hotel", count: "150+" },
  { icon: "🍽️", label: "Caterers", slug: "caterer", count: "300+" },
  { icon: "📷", label: "Cameramen", slug: "cameraman", count: "180+" },
  { icon: "🎧", label: "DJs", slug: "dj", count: "120+" },
  { icon: "🌸", label: "Decorators", slug: "decorator", count: "250+" },
];

const STATS = [
  { icon: <Search size={20} />, value: "Easy", label: "Service Discovery" },
  {
    icon: <CalendarDays size={20} />,
    value: "Simple",
    label: "Online Booking",
  },
  { icon: <Shield size={20} />, value: "Secure", label: "Booking Process" },
  { icon: <Layers size={20} />, value: "All-in-One", label: "Event Planning" },
];
export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050d1e] text-white">
      {/* =========================================================
        HERO
    ========================================================= */}
      <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-indigo-500/[0.10] blur-[120px]" />
          <div className="absolute -bottom-60 -left-40 h-[600px] w-[600px] rounded-full bg-yellow-400/[0.07] blur-[130px]" />
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-900/[0.12] blur-[140px]" />

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/[0.07] px-4 py-2 text-xs font-semibold text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.05)]">
              <Star size={13} fill="currentColor" />
              India&apos;s #1 Event Booking Platform
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-[clamp(42px,7vw,76px)] font-black leading-[1.04] tracking-[-0.04em] text-white">
              Book the Perfect
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Event Services
              </span>
              <br />
              For Your Big Day
            </h1>

            {/* Description */}
            <p className="mb-10 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Discover and book premium venues, caterers, DJs, decorators,
              cameramen &amp; more — all in one place. Make your event
              unforgettable.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/services"
                id="hero-browse-btn"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-bold text-slate-950 shadow-[0_10px_35px_rgba(250,204,21,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_15px_40px_rgba(250,204,21,0.2)]"
              >
                Explore Services
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/register"
                id="hero-signup-btn"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-6 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
              >
                Create Account
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verified Service Providers
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Secure Booking
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Easy Cancellation
              </span>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050d1e] to-transparent" />
      </section>

      {/* =========================================================
        STATS
    ========================================================= */}
      <section className="border-y border-white/[0.07] bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-white/[0.07] md:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center px-4 py-3 text-center"
              >
                <div className="mb-3 text-yellow-400">{stat.icon}</div>

                <div className="text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </div>

                <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
        CATEGORIES
    ========================================================= */}
      <section className="relative bg-[#050d1e] py-24">
        <div className="pointer-events-none absolute left-1/2 top-20 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/[0.04] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              Explore
            </span>

            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Browse by Category
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              Find every service you need for your perfect event, all in one
              platform.
            </p>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/services?category=${cat.slug}`}
                id={`category-${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/25 hover:bg-white/[0.055] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-400/[0.08] opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-2xl transition-transform duration-300 group-hover:scale-110">
                    {cat.icon}
                  </div>

                  <ArrowRight
                    size={18}
                    className="mt-1 text-slate-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-yellow-400"
                  />
                </div>

                <h3 className="relative z-10 mt-6 text-base font-bold text-white">
                  {cat.label}
                </h3>

                <p className="relative z-10 mt-1 text-sm text-slate-500">
                  {cat.count} listings
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
        HOW IT WORKS
    ========================================================= */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#071126] py-24">
        <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-500/[0.06] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              Simple Process
            </span>

            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              How It Works
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              Book your dream event service in three simple steps.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Search & Filter",
                desc: "Browse hundreds of services. Filter by category, location, price, and dates to find exactly what you need.",
              },
              {
                step: "02",
                title: "View & Compare",
                desc: "See detailed descriptions, photos, pricing, and availability. Compare services and choose the right one.",
              },
              {
                step: "03",
                title: "Book Instantly",
                desc: "Select your dates, confirm your booking, and receive an instant confirmation.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-7 transition-all duration-300 hover:border-yellow-400/20 hover:bg-white/[0.05]"
              >
                <div className="absolute right-5 top-3 text-7xl font-black leading-none text-white/[0.025] transition-colors duration-300 group-hover:text-yellow-400/[0.05]">
                  {item.step}
                </div>

                <div className="relative z-10">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-bold text-yellow-400">
                    {item.step}
                  </div>

                  <h3 className="mb-3 text-lg font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-6 text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
        CTA
    ========================================================= */}
      <section className="bg-[#050d1e] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-400/15 bg-gradient-to-br from-[#0d1b38] via-[#0b1730] to-[#101d3b] px-6 py-16 text-center sm:px-10">
            {/* Glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/[0.05] blur-[100px]" />

            <div className="relative z-10">
              <span className="mb-4 inline-block rounded-full border border-yellow-400/20 bg-yellow-400/[0.07] px-3 py-1.5 text-xs font-semibold text-yellow-400">
                Start Planning Today
              </span>

              <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                Ready to Plan Your
                <br />
                <span className="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Dream Event?
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Join thousands of happy customers who trust EventBook for their
                special occasions.
              </p>

              <div className="mt-9">
                <Link
                  href="/services"
                  id="cta-browse-btn"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-bold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_15px_40px_rgba(250,204,21,0.2)]"
                >
                  Browse All Services
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
        FOOTER
    ========================================================= */}
      <footer className="border-t border-white/[0.07] bg-[#040a16]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            {/* Brand */}
            <div className="max-w-xs">
              <Link
                href="/"
                className="text-xl font-black tracking-tight text-white"
              >
                Event<span className="text-yellow-400">Book</span>
              </Link>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                India&apos;s premium event services booking platform.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-7 gap-y-3">
              <Link
                href="/services"
                className="text-sm text-slate-500 transition-colors hover:text-yellow-400"
              >
                Browse Services
              </Link>

              <Link
                href="/register"
                className="text-sm text-slate-500 transition-colors hover:text-yellow-400"
              >
                Sign Up
              </Link>

              <Link
                href="/login"
                className="text-sm text-slate-500 transition-colors hover:text-yellow-400"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.06] pt-6 text-center text-xs text-slate-600">
            © 2024 EventBook. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
