"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  allowAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname || "/dashboard")}`);
      } else if (!allowAdmin && isAdmin) {
        if (pathname?.startsWith("/bookings")) {
          router.replace("/admin/bookings");
        } else {
          router.replace("/admin/dashboard");
        }
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, allowAdmin, router, pathname]);

  if (isLoading || !isAuthenticated || (!allowAdmin && isAdmin)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d1e] px-4 text-white">
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] to-[#f59e0b] shadow-[0_8px_30px_rgba(255,215,0,0.25)]">
            <CalendarDays size={28} className="text-[#0f1c3f]" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
            <span className="text-sm font-semibold text-slate-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d1e] px-4 text-white">
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] to-[#f59e0b] shadow-[0_8px_30px_rgba(255,215,0,0.25)]">
            <CalendarDays size={28} className="text-[#0f1c3f]" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
            <span className="text-sm font-semibold text-slate-300">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
