"use client";

import Link from "next/link";
import { Globe, LogOut } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./navConfig";

interface AdminMobileDrawerProps {
  user: {
    name?: string;
    email?: string;
  } | null;
  pathname: string;
  logout: () => void;
}

export default function AdminMobileDrawer({
  user,
  pathname,
  logout,
}: AdminMobileDrawerProps) {
  return (
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

      <Link
        href="/services"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "11px 14px",
          borderRadius: "9px",
          fontSize: "14px",
          color: "#94a3b8",
          textDecoration: "none",
        }}
      >
        <Globe size={16} />
        View Live Site
      </Link>

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
  );
}
