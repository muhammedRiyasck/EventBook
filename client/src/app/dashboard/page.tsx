"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Search, ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAdmin) router.push("/admin/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !user) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper pt-[100px] pb-[80px] relative overflow-hidden">
      <div className="glow-dot w-[600px] h-[600px] bg-[rgba(26,50,105,0.3)] -top-[100px] -right-[100px]" />
      <div className="container">
        {/* Welcome */}
        <div className="flex items-center gap-5 mb-12 animate-[fadeInUp_0.4s_ease]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gold-400)] to-[var(--gold-600)] flex items-center justify-center font-display text-[28px] font-extrabold text-[var(--navy-900)] shrink-0 shadow-[0_4px_20px_rgba(255,215,0,0.3)]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-[clamp(22px,3vw,32px)] font-extrabold text-white leading-[1.2]">
              Welcome back,{" "}
              <span className="gradient-text">{user.name.split(" ")[0]}</span>!
              👋
            </h1>
            <p style={{ color: "var(--slate-400)", fontSize: 15 }}>
              {user.email} · {user.phone || "No phone added"}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-[18px] font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-col gap-3 max-w-[600px]">
          <Link
            href="/services"
            className="flex items-center gap-4 py-[18px] px-5 bg-white/5 border border-white/10 rounded-lg transition-all duration-200 animate-[fadeInUp_0.4s_ease] hover:border-[#ffd700]/30 hover:translate-x-1 hover:bg-white/10 group"
            id="dashboard-browse-btn"
          >
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,215,0,0.1)",
                color: "var(--gold-400)",
              }}
            >
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-0.5 ">
                Browse Services
              </h3>
              <p className="text-[13px] text-slate-400">
                Search and book event services
              </p>
            </div>
            <ArrowRight
              size={18}
              className="ml-auto text-slate-500 shrink-0 group-hover:text-[var(--gold-400)]"
            />
          </Link>

          <Link
            href="/bookings"
            className="flex items-center gap-4 py-[18px] px-5 bg-white/5 border border-white/10 rounded-lg transition-all duration-200 animate-[fadeInUp_0.4s_ease] hover:border-[#ffd700]/30 hover:translate-x-1 hover:bg-white/10 group"
            id="dashboard-bookings-btn"
          >
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-0.5">
                My Bookings
              </h3>
              <p className="text-[13px] text-slate-400">
                View and manage your bookings
              </p>
            </div>
            <ArrowRight
              size={18}
              className="ml-auto text-slate-500 shrink-0 group-hover:text-[var(--gold-400)]"
            />
          </Link>

          <div
            className="flex items-center gap-4 py-[18px] px-5 bg-white/5 border border-white/10 rounded-lg transition-all duration-200 animate-[fadeInUp_0.4s_ease] hover:border-[#ffd700]/30 hover:translate-x-1 hover:bg-white/10 group"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "var(--success)",
              }}
            >
              <User size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-0.5">
                My Profile
              </h3>
              <p className="text-[13px] text-slate-400">
                Update your account details
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--slate-600)",
                marginLeft: "auto",
              }}
            >
              Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
