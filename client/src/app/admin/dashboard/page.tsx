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
  <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
    {/* Background Glow */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/[0.03] blur-[100px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Overview of your EventBook platform
          </p>
        </div>

        <Link
          href="/admin/services/new"
          id="add-service-btn"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)]"
        >
          <span className="text-lg leading-none">+</span>
          Add Service
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/20 hover:bg-white/[0.05] hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)]"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: card.bg,
                color: card.color,
              }}
            >
              {card.icon}
            </div>

            <div className="mt-5 text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
              {loading ? (
                <span className="text-slate-600">—</span>
              ) : (
                card.value
              )}
            </div>

            <div className="mt-2 text-sm font-medium text-slate-400">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Manage */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Manage</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your platform services and bookings
          </p>
        </div>

        <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Services */}
          <Link
            href="/admin/services"
            id="admin-services-link"
            className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-400/20 hover:bg-white/[0.055] hover:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-400/10 bg-purple-400/10 text-purple-400">
              <Layers size={22} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white">
                Services
              </h3>

              <p className="mt-1 text-[13px] text-slate-400">
                Add, edit, or remove services
              </p>
            </div>

            <span className="ml-auto shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-yellow-400">
              →
            </span>
          </Link>

          {/* Bookings */}
          <Link
            href="/admin/bookings"
            id="admin-bookings-link"
            className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-white/[0.055] hover:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/10 text-blue-400">
              <CalendarDays size={22} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white">
                Bookings
              </h3>

              <p className="mt-1 text-[13px] text-slate-400">
                View and manage all bookings
              </p>
            </div>

            <span className="ml-auto shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-yellow-400">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  </div>
);
}
