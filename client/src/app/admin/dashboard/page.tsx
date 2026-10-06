"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  totalServices: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

export default function AdminDashboardPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalServices: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [svcRes, bkRes] = await Promise.all([
          api.get("/services?limit=1"),
          api.get("/bookings?limit=1"),
        ]);
        const confirmedRes = await api.get(
          "/bookings?limit=1&status=confirmed",
        );
        const cancelledRes = await api.get(
          "/bookings?limit=1&status=cancelled",
        );
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

  if (isLoading || !isAdmin)
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

  const STAT_CARDS = [
    {
      icon: <Layers size={22} />,
      label: "Total Services",
      value: stats.totalServices,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.1)",
    },
    {
      icon: <CalendarDays size={22} />,
      label: "Total Bookings",
      value: stats.totalBookings,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      icon: <TrendingUp size={22} />,
      label: "Confirmed",
      value: stats.confirmedBookings,
      color: "var(--success)",
      bg: "rgba(34,197,94,0.1)",
    },
    {
      icon: <LayoutDashboard size={22} />,
      label: "Cancelled",
      value: stats.cancelledBookings,
      color: "var(--error)",
      bg: "rgba(239,68,68,0.1)",
    },
  ];

  return (
    <div className="page-wrapper pt-[100px] pb-[80px] relative overflow-hidden">
      <div className="glow-dot w-[600px] h-[600px] bg-[rgba(26,50,105,0.3)] -top-[100px] -right-[200px]" />
      <div className="container">
        <div className="flex items-start justify-between mb-9 gap-4">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p style={{ color: "var(--slate-400)", marginTop: 8 }}>
              Overview of your EventBook platform
            </p>
          </div>
          <Link
            href="/admin/services/new"
            className="btn btn-primary"
            id="add-service-btn"
          >
            + Add Service
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              className="bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-2.5 animate-[fadeInUp_0.4s_ease] transition-all duration-200 hover:border-[#ffd700]/20 hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center"
                style={{ background: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              <div className="font-display text-[36px] font-black text-white leading-none">
                {loading ? "—" : card.value}
              </div>
              <div className="text-[13px] text-slate-400 font-medium">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <h2 className="text-[18px] font-bold text-white mb-4">Manage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[600px]">
          <Link
            href="/admin/services"
            className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-lg transition-all duration-200 hover:border-[#ffd700]/30 hover:translate-x-1 hover:bg-white/10"
            id="admin-services-link"
          >
            <div className="w-12 h-12 rounded-md bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">
                Services
              </h3>
              <p className="text-[13px] text-slate-400">
                Add, edit, or remove services
              </p>
            </div>
          </Link>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-lg transition-all duration-200 hover:border-[#ffd700]/30 hover:translate-x-1 hover:bg-white/10"
            id="admin-bookings-link"
          >
            <div
              className="w-12 h-12 rounded-md bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
            >
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">
                Bookings
              </h3>
              <p className="text-[13px] text-slate-400">
                View and manage all bookings
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
