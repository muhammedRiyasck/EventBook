"use client";

import Link from "next/link";
import { ChevronDown, ShieldCheck, Globe, LogOut } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./navConfig";

interface AdminUserMenuProps {
  user: {
    name?: string;
    email?: string;
  } | null;
  pathname: string;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  logout: () => void;
}

export default function AdminUserMenu({
  user,
  pathname,
  userMenuOpen,
  setUserMenuOpen,
  logout,
}: AdminUserMenuProps) {
  return (
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

          {ADMIN_NAV_ITEMS.map((item) => {
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

          <Link
            href="/services"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              color: "#94a3b8",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLAnchorElement).style.color = "#ffd700";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
            }}
          >
            <Globe size={14} />
            View Live Site
          </Link>

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
  );
}
