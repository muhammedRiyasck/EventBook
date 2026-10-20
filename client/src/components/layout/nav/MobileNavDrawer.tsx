"use client";

import Link from "next/link";
import {
  CalendarDays,
  LogOut,
  LayoutDashboard,
  Settings,
  Sparkles,
  ShieldCheck,
  Ticket,
} from "lucide-react";

interface MobileNavDrawerProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  pathname: string;
  logout: () => void;
}

export default function MobileNavDrawer({
  isOpen,
  isAuthenticated,
  isAdmin,
  user,
  pathname,
  logout,
}: MobileNavDrawerProps) {
  if (!isOpen) return null;

  const isServicesActive = pathname?.startsWith("/services");
  const isBookingsActive = pathname?.startsWith("/bookings");
  const isDashboardActive = pathname === "/dashboard";

  return (
    <div className="md:hidden bg-[#050d1e]/98 border-t border-white/10 backdrop-blur-[24px] px-4 py-4 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
      {/* User Preview in Mobile */}
      {isAuthenticated && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#ffd700] to-[#f59e0b] flex items-center justify-center text-[14px] font-extrabold text-[#0f1c3f] shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-white truncate">{user?.name}</p>
            <p className="text-[12px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-400/10 text-[#ffd700] border border-yellow-400/20">
            {user?.role || "Client"}
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <div className="space-y-1">
        <Link
          href="/services"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium transition-colors ${
            isServicesActive
              ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/20"
              : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Sparkles size={17} className={isServicesActive ? "text-[#ffd700]" : "text-slate-400"} />
          Explore Services
        </Link>

        {isAuthenticated && !isAdmin && (
          <>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium transition-colors ${
                isDashboardActive
                  ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/20"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <LayoutDashboard size={17} className={isDashboardActive ? "text-[#ffd700]" : "text-slate-400"} />
              Dashboard
            </Link>
            <Link
              href="/bookings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium transition-colors ${
                isBookingsActive
                  ? "text-[#ffd700] bg-yellow-400/10 border border-yellow-400/20"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Ticket size={17} className={isBookingsActive ? "text-[#ffd700]" : "text-slate-400"} />
              My Bookings
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
            >
              <ShieldCheck size={17} />
              Admin Panel
            </Link>
            <Link
              href="/admin/services"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.04]"
            >
              <Settings size={17} className="text-yellow-400" />
              Manage Services
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.04]"
            >
              <CalendarDays size={17} className="text-yellow-400" />
              Customer Bookings
            </Link>
          </>
        )}
      </div>

      <div className="h-[1px] bg-white/[0.08]" />

      {/* Auth Action */}
      {isAuthenticated ? (
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/login"
            className="w-full text-center py-2.5 rounded-xl text-[14px] font-medium text-white bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full text-center py-2.5 rounded-xl text-[14px] font-bold bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-[0_4px_16px_rgba(250,204,21,0.25)] hover:brightness-105 transition-all"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
