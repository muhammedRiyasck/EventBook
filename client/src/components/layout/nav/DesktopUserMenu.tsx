"use client";

import Link from "next/link";
import {
  CalendarDays,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Ticket,
} from "lucide-react";

interface DesktopUserMenuProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  logout: () => void;
}

export default function DesktopUserMenu({
  isAuthenticated,
  isAdmin,
  user,
  dropdownOpen,
  setDropdownOpen,
  logout,
}: DesktopUserMenuProps) {
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="px-4 py-2 rounded-full text-[13.5px] font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all duration-200"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-5 py-2 rounded-full text-[13.5px] font-bold bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-[0_4px_16px_rgba(250,204,21,0.22)] hover:shadow-[0_6px_22px_rgba(250,204,21,0.38)] hover:brightness-105 active:scale-95 transition-all duration-200"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" id="user-menu-wrapper">
      <button
        className={`flex items-center gap-2.5 bg-white/[0.04] border rounded-full py-1.5 pr-3.5 pl-1.5 text-white cursor-pointer transition-all duration-200 hover:border-yellow-400/40 hover:bg-white/[0.08] ${
          dropdownOpen
            ? "border-yellow-400/50 bg-white/[0.08] shadow-[0_0_15px_rgba(250,204,21,0.15)]"
            : "border-white/10"
        }`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        id="user-menu-btn"
        aria-expanded={dropdownOpen}
      >
        <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[#ffd700] to-[#f59e0b] flex items-center justify-center text-[13px] font-extrabold text-[#0f1c3f] shadow-[0_2px_8px_rgba(250,204,21,0.3)] shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="text-[13.5px] font-medium text-slate-200 max-w-[120px] truncate">
          {user?.name?.split(" ")[0]}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180 text-yellow-400" : ""
          }`}
        />
      </button>

      {/* User Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[240px] bg-[#0a132d]/98 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,215,0,0.05)] backdrop-blur-[24px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3.5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#ffd700] to-[#f59e0b] flex items-center justify-center text-[14px] font-extrabold text-[#0f1c3f] shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[12px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-yellow-400/10 text-[#ffd700] border border-yellow-400/20">
              {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
              {user?.role || "Client"}
            </span>
          </div>

          <div className="h-[1px] bg-white/[0.08]" />

          {/* Menu Links */}
          <div className="p-1.5 space-y-0.5">
            {isAdmin ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <LayoutDashboard size={16} className="text-yellow-400" />
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/services"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Settings size={16} className="text-yellow-400" />
                  Manage Services
                </Link>
                <Link
                  href="/admin/bookings"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <CalendarDays size={16} className="text-yellow-400" />
                  Customer Bookings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <LayoutDashboard size={16} className="text-yellow-400" />
                  Dashboard
                </Link>
                <Link
                  href="/bookings"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Ticket size={16} className="text-yellow-400" />
                  My Bookings
                </Link>
                <Link
                  href="/services"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Sparkles size={16} className="text-yellow-400" />
                  Explore Services
                </Link>
              </>
            )}
          </div>

          <div className="h-[1px] bg-white/[0.08]" />

          {/* Sign Out */}
          <div className="p-1.5">
            <button
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
              onClick={logout}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
