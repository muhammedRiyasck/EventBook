"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Layers,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p: string) => p === "/admin/dashboard" || p === "/admin",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: Layers,
    match: (p: string) => p.startsWith("/admin/services"),
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/admin/bookings"),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    match: (p: string) => p.startsWith("/admin/users"),
  },
  {
    href: "/admin/earnings",
    label: "Earnings",
    icon: DollarSign,
    match: (p: string) => p.startsWith("/admin/earnings"),
  },
];

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
          <div
            className="hidden md:flex"
            style={{
              alignItems: "center",
              gap: "2px",
              flex: 1,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 13px",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                    color: active ? "#ffd700" : "rgba(148,163,184,1)",
                    background: active ? "rgba(255,215,0,0.09)" : "transparent",
                    border: active
                      ? "1px solid rgba(255,215,0,0.15)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(148,163,184,1)";
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: User Menu */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
          >
            {/* Desktop user button */}
            <div
              id="admin-user-menu-wrapper"
              style={{ position: "relative" }}
              className="hidden md:block"
            >
              <button
                id="admin-user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.04)",
                  border: userMenuOpen
                    ? "1px solid rgba(255,215,0,0.3)"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50px",
                  padding: "5px 12px 5px 5px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: "#fff",
                }}
                onMouseEnter={(e) => {
                  if (!userMenuOpen)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,215,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  if (!userMenuOpen)
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(255,255,255,0.1)";
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#0f1c3f",
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#e2e8f0",
                    maxWidth: "90px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: "#64748b",
                    transition: "transform 0.2s ease",
                    transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: "215px",
                    background: "rgba(10,19,45,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.04)",
                    backdropFilter: "blur(20px)",
                    overflow: "hidden",
                    animation: "adminFadeDown 0.15s ease",
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: "14px 16px 12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#0f1c3f",
                          flexShrink: 0,
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user?.name}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "11px",
                            color: "#64748b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(255,215,0,0.1)",
                        border: "1px solid rgba(255,215,0,0.18)",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#ffd700",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      <ShieldCheck size={9} strokeWidth={2.5} />
                      Administrator
                    </span>
                  </div>

                  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                  {NAV_ITEMS.map((item) => {
                    const active = item.match(pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 16px",
                          fontSize: "13px",
                          fontWeight: active ? 600 : 400,
                          color: active ? "#ffd700" : "#94a3b8",
                          background: active ? "rgba(255,215,0,0.06)" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background =
                            "rgba(255,255,255,0.04)";
                          if (!active)
                            (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = active
                            ? "rgba(255,215,0,0.06)"
                            : "transparent";
                          if (!active)
                            (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
                        }}
                      >
                        <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                        {item.label}
                      </Link>
                    );
                  })}

                  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                  <button
                    onClick={logout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#ef4444",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

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
          <div
            className="md:hidden"
            style={{
              background: "rgba(5,13,30,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              padding: "12px 16px 20px",
            }}
          >
            {/* User info strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                marginBottom: "10px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#0f1c3f",
                  flexShrink: 0,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                  {user?.name}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Administrator</p>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 14px",
                      borderRadius: "9px",
                      fontSize: "14px",
                      fontWeight: active ? 600 : 500,
                      color: active ? "#ffd700" : "#94a3b8",
                      background: active ? "rgba(255,215,0,0.08)" : "transparent",
                      border: active
                        ? "1px solid rgba(255,215,0,0.12)"
                        : "1px solid transparent",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.07)",
                margin: "12px 0",
              }}
            />

            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 14px",
                borderRadius: "9px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#ef4444",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
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
