"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ShieldCheck, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminDesktopNav from "./admin/AdminDesktopNav";
import AdminUserMenu from "./admin/AdminUserMenu";
import AdminMobileDrawer from "./admin/AdminMobileDrawer";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Only show on admin routes
  const isAdminRoute = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#admin-user-menu-wrapper")) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  if (!isAdminRoute) return null;

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "72px",
          transition: "all 0.3s ease",
          borderBottom: scrolled
            ? "1px solid rgba(255,215,0,0.08)"
            : "1px solid rgba(255,255,255,0.05)",
          background: scrolled
            ? "rgba(5,13,30,0.97)"
            : "rgba(5,13,30,0.88)",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled
            ? "0 4px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,215,0,0.06)"
            : "none",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 28px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Logo + Admin Badge */}
          <Link
            href="/admin/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              marginRight: "12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                boxShadow: "0 6px 20px rgba(255,215,0,0.32)",
                flexShrink: 0,
              }}
            >
              <CalendarDays size={26} color="#0f1c3f" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display, sans-serif)",
                fontWeight: 800,
                fontSize: "22px",
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              Event<span style={{ color: "#ffd700" }}>Book</span>
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255,215,0,0.12)",
                border: "1px solid rgba(255,215,0,0.22)",
                borderRadius: "7px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffd700",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={12} strokeWidth={2.5} />
              Admin
            </span>
          </Link>

          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "22px",
              background: "rgba(255,255,255,0.08)",
              marginRight: "4px",
              flexShrink: 0,
            }}
            className="hidden md:block"
          />

          {/* Desktop Nav Links */}
          <AdminDesktopNav pathname={pathname} />

          {/* Right: User Menu */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
          >
            <AdminUserMenu
              user={user}
              pathname={pathname}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              logout={logout}
            />

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "7px",
                cursor: "pointer",
                color: "#e2e8f0",
              }}
              aria-label="Toggle admin menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <AdminMobileDrawer
            user={user}
            pathname={pathname}
            logout={logout}
          />
        )}
      </nav>

      <style>{`
        @keyframes adminFadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
