"use client";

import Link from "next/link";
import { ADMIN_NAV_ITEMS } from "./navConfig";

interface AdminDesktopNavProps {
  pathname: string;
}

export default function AdminDesktopNav({ pathname }: AdminDesktopNavProps) {
  return (
    <div
      className="hidden md:flex"
      style={{
        alignItems: "center",
        gap: "2px",
        flex: 1,
      }}
    >
      {ADMIN_NAV_ITEMS.map((item) => {
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
  );
}
