"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Search, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/AuthGuards";

function DashboardContent() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Welcome */}
        <div className="mb-12 flex items-center gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-[26px] font-extrabold text-[#050d1e] shadow-[0_4px_25px_rgba(250,204,21,0.2)]">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h1 className="text-[clamp(22px,3vw,32px)] font-extrabold leading-tight tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                {user.name.split(" ")[0]}
              </span>
              !
            </h1>

            <p className="mt-1 truncate text-sm text-slate-400 sm:text-[15px]">
              {user.email}
              <span className="mx-2 text-slate-600">·</span>
              {user.phone || "No phone added"}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your event bookings and account
            </p>
          </div>

          <div className="flex max-w-2xl flex-col gap-3">
            {/* Browse Services */}
            <Link
              href="/services"
              id="dashboard-browse-btn"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-400/25 hover:bg-white/[0.055] hover:shadow-[0_10px_35px_rgba(0,0,0,0.2)] sm:p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-yellow-400/10 bg-yellow-400/10 text-yellow-400">
                <Search size={22} />
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-white">
                  Browse Services
                </h3>
                <p className="mt-1 text-[13px] text-slate-400">
                  Search and book event services
                </p>
              </div>

              <ArrowRight
                size={18}
                className="ml-auto shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-yellow-400"
              />
            </Link>

            {/* My Bookings */}
            <Link
              href="/bookings"
              id="dashboard-bookings-btn"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-white/[0.055] hover:shadow-[0_10px_35px_rgba(0,0,0,0.2)] sm:p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/10 text-blue-400">
                <CalendarDays size={22} />
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-white">
                  My Bookings
                </h3>
                <p className="mt-1 text-[13px] text-slate-400">
                  View and manage your bookings
                </p>
              </div>

              <ArrowRight
                size={18}
                className="ml-auto shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-yellow-400"
              />
            </Link>

            {/* My Profile - Coming Soon */}
            <div className="group flex cursor-not-allowed items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 opacity-50 sm:p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/10 text-emerald-400">
                <User size={22} />
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-white">My Profile</h3>
                <p className="mt-1 text-[13px] text-slate-400">
                  Update your account details
                </p>
              </div>

              <span className="ml-auto shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Soon
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
