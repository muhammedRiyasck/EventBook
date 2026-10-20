"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DesktopNavLinks from "./nav/DesktopNavLinks";
import DesktopUserMenu from "./nav/DesktopUserMenu";
import MobileNavDrawer from "./nav/MobileNavDrawer";

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
        <DesktopNavLinks
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
        />

        {/* Right Section: Auth & Profile */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <DesktopUserMenu
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            user={user}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            logout={logout}
          />
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
      <MobileNavDrawer
        isOpen={isOpen}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        pathname={pathname}
        logout={logout}
      />
    </nav>
  );
}
