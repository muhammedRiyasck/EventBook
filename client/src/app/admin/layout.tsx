"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname || "/admin/dashboard")}`);
      } else if (!isAdmin) {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router, pathname]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d1e] px-4 text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-yellow-400/[0.04] blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-900/[0.15] blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] to-[#f59e0b] shadow-[0_8px_30px_rgba(255,215,0,0.25)]">
            <ShieldCheck size={30} className="text-[#0f1c3f]" strokeWidth={2.5} />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400" />
            <span className="text-sm font-semibold text-slate-300">
              Verifying Administrator Access...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
