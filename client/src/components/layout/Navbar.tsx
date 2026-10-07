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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 ease-in-out border-b border-transparent ${scrolled ? "bg-[#050d1e]/92 border-b-white/10 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.4)]" : ""}`}
    >
      <div
        className={`h-[72px] flex items-center justify-between gap-8 container mx-auto px-4`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-[20px] font-extrabold tracking-tight text-white transition-opacity duration-200 shrink-0 hover:opacity-85"
        >
          <CalendarDays size={22} className="text-[var(--gold-400)] shrink-0" />
          <span>
            Event<span className="text-[var(--gold-400)]">Book</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <Link
            href="/services"
            className={`px-[14px] py-[6px] rounded-full text-[14px] font-medium text-slate-300 transition-colors duration-200 text-yellow-600 outline hover:text-white hover:bg-white/10 ${pathname.startsWith("/services") ? "!text-[var(--gold-400)] !bg-[#ffd700]/10 " : ""}`}
          >
            Browse Services
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link
              href="/bookings"
              className={`px-[14px] py-[6px] rounded-full text-[14px] font-medium text-slate-300 transition-colors duration-200 text-yellow-600 outline mx-2 hover:text-white hover:bg-white/10 ${pathname === "/bookings" ? " !text-[var(--gold-400)] !bg-[#ffd700]/10 " : ""}`}
            >
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`px-[14px] py-[6px] rounded-full text-[14px] font-medium text-slate-300 transition-colors duration-200 hover:text-white hover:bg-white/10 ${pathname.startsWith("/admin") ? "!text-[var(--gold-400)] !bg-[#ffd700]/10" : ""}`}
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full py-1.5 pr-3 pl-1.5 text-white cursor-pointer transition-all duration-200 hover:border-[var(--gold-400)] hover:bg-white/10"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="user-menu-btn"
              >
                <div className="w-[30px] h-[30px] rounded-full bg-yellow-400 flex items-center justify-center text-[13px] font-bold text-slate-900 shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>
              {dropdownOpen && (
                <div className="absolute top-[calc(100%+10px)] right-0 w-[220px] bg-slate-800 border border-white/10 rounded-lg shadow-lg overflow-hidden animate-in fade-in duration-150 backdrop-blur-[20px]">
                  <div className="px-4 py-3.5">
                    <p className="text-[14px] font-semibold text-white mb-0.5">
                      {user?.name}
                    </p>
                    <p className="text-[12px] text-slate-400 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                      {user?.email}
                    </p>
                    <span
                      className={`badge ${isAdmin ? "badge-info" : ""} px-2 outline rounded-full`}
                      style={{
                        background: "rgba(255,215,0,0.15)",
                        color: "#ffd700",
                        fontSize: "11px",
                      }}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <div className="h-[1px] bg-white/10" />
                  {isAdmin ? (
                    <>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-300 cursor-pointer transition-colors duration-150 w-full text-left bg-transparent hover:bg-white/5 hover:text-white"
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link
                        href="/admin/services"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-300 cursor-pointer transition-colors duration-150 w-full text-left bg-transparent hover:bg-white/5 hover:text-white"
                      >
                        <Settings size={15} /> Manage Services
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-300 cursor-pointer transition-colors duration-150 w-full text-left bg-transparent hover:bg-white/5 hover:text-white"
                      >
                        <User size={15} /> Dashboard
                      </Link>
                      <Link
                        href="/bookings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-300 cursor-pointer transition-colors duration-150 w-full text-left bg-transparent hover:bg-white/5 hover:text-white outline "
                      >
                        <CalendarDays size={15} /> My Bookings
                      </Link>
                    </>
                  )}
                  <div className="h-[1px] bg-white/10" />
                  <button
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-300 cursor-pointer transition-colors duration-150 w-full text-left bg-transparent hover:bg-white/5 hover:text-white !text-red-500 hover:!bg-red-500/10"
                    onClick={logout}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm text-white outline rounded-full px-4 py-2 hover:bg-yellow-400 hover:text-black">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm text-white outline rounded-full px-4 py-2 hover:bg-yellow-400 hover:text-black">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden bg-transparent text-white p-1"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="flex md:hidden flex-col px-4 py-3 pb-5 bg-[#050d1e]/97 border-t border-white/10 backdrop-blur-[20px]">
          <Link
            href="/services"
            className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)]"
          >
            Browse Services
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link
              href="/bookings"
              className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)]"
            >
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)]"
            >
              Admin Panel
            </Link>
          )}
          <div className="h-[1px] bg-white/10 my-2" />
          {isAuthenticated ? (
            <button
              className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)] text-left w-full bg-transparent !text-red-500"
              onClick={logout}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-2 py-3 text-[15px] text-slate-300 font-medium border-b border-white/5 block hover:text-[var(--gold-400)] "
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
