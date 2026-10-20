import {
  CalendarDays,
  LayoutDashboard,
  Layers,
  Users,
  DollarSign,
  LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
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
