"use client";

import Link from "next/link";
import { Sparkles, LayoutDashboard, Ticket, ShieldCheck } from "lucide-react";

interface DesktopNavLinksProps {
  pathname: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export default function DesktopNavLinks({
  pathname,
  isAuthenticated,
  isAdmin,
}: DesktopNavLinksProps) {
  const isServicesActive = pathname?.startsWith("/services");
  const isBookingsActive = pathname?.startsWith("/bookings");
  const isDashboardActive = pathname === "/dashboard";

  return (
    <div className="hidden md:flex items-center gap-1.5 flex-1 ml-4">
      <Link
        href="/services"
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
          isServicesActive
            ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/25 shadow-[0_0_15px_rgba(250,204,21,0.08)]"
            : "text-slate-300 border border-transparent hover:text-white hover:bg-white/[0.06]"
        }`}
      >
        <Sparkles size={15} className={isServicesActive ? "text-[#ffd700]" : "text-slate-400"} />
        Explore Services
      </Link>

      {isAuthenticated && !isAdmin && (
        <>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
              isDashboardActive
                ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/25 shadow-[0_0_15px_rgba(250,204,21,0.08)]"
                : "text-slate-300 border border-transparent hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <LayoutDashboard size={15} className={isDashboardActive ? "text-[#ffd700]" : "text-slate-400"} />
            Dashboard
          </Link>

          <Link
            href="/bookings"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
              isBookingsActive
                ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/25 shadow-[0_0_15px_rgba(250,204,21,0.08)]"
                : "text-slate-300 border border-transparent hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Ticket size={15} className={isBookingsActive ? "text-[#ffd700]" : "text-slate-400"} />
            My Bookings
          </Link>
        </>
      )}

      {isAdmin && (
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 text-yellow-400/90 hover:text-[#ffd700] hover:bg-yellow-400/10 border border-yellow-400/20"
        >
          <ShieldCheck size={15} className="text-[#ffd700]" />
          Admin Panel
        </Link>
      )}
    </div>
  );
}
