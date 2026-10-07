"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ServiceForm from "@/components/services/ServiceForm";

export default function NewServicePage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
  <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
    {/* Background Glow */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/[0.03] blur-[100px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-5xl">
      {/* Back */}
      <Link
        href="/admin/services"
        className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-yellow-400"
      >
        <ChevronLeft size={16} />
        Back to Services
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
          Administration
        </p>

        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Add New Service
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Fill in the details below to list a new service on the platform.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7">
        <ServiceForm mode="create" />
      </div>
    </div>
  </div>
);
}
