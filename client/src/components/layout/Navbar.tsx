"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#user-menu-wrapper")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Let AdminNavbar handle all /admin routes
  if (pathname?.startsWith("/admin")) return null;

  const isServicesActive = pathname?.startsWith("/services");
  const isBookingsActive = pathname?.startsWith("/bookings");
  const isDashboardActive = pathname === "/dashboard";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 ease-in-out border-b ${
        scrolled
          ? "bg-[#050d1e]/95 border-white/10 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-[#050d1e]/80 border-white/[0.06] backdrop-blur-[12px]"
      }`}
    >
      <div className="h-[72px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group shrink-0 transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="w-[44px] h-[44px] rounded-[13px] bg-gradient-to-br from-[#ffd700] to-[#f59e0b] flex items-center justify-center shadow-[0_6px_20px_rgba(255,215,0,0.28)] shrink-0 transition-transform duration-200 group-hover:shadow-[0_8px_24px_rgba(255,215,0,0.4)]">
            <CalendarDays size={24} className="text-[#0f1c3f]" strokeWidth={2.5} />
          </div>
          <span className="font-display font-extrabold text-[22px] tracking-tight text-white">
            Event<span className="text-[#ffd700]">Book</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
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

        {/* Right Section: Auth & Profile */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <div className="relative" id="user-menu-wrapper">
              <button
                className={`flex items-center gap-2.5 bg-white/[0.04] border rounded-full py-1.5 pr-3.5 pl-1.5 text-white cursor-pointer transition-all duration-200 hover:border-yellow-400/40 hover:bg-white/[0.08] ${
                  dropdownOpen ? "border-yellow-400/50 bg-white/[0.08] shadow-[0_0_15px_rgba(250,204,21,0.15)]" : "border-white/10"
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
          ) : (
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
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
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
      )}
    </nav>
  );
}
