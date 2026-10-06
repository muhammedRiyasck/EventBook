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
    <div className="page-wrapper pt-[100px] pb-[80px]">
      <div className="container">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1 text-[14px] text-slate-400 mb-6 transition-colors duration-200 hover:text-[var(--gold-400)]"
        >
          <ChevronLeft size={16} /> Back to Services
        </Link>
        <div className="mb-8">
          <h1 className="section-title">Add New Service</h1>
          <p className="section-subtitle" style={{ marginTop: 8 }}>
            Fill in the details below to list a new service on the platform.
          </p>
        </div>
        <ServiceForm mode="create" />
      </div>
    </div>
  );
}
