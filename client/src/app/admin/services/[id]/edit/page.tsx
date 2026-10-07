"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Service } from "@/types";
import { useAuth } from "@/context/AuthContext";
import ServiceForm from "@/components/services/ServiceForm";

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/services/${id}`);
        setService(data.data);
      } catch {
        toast.error("Failed to load service");
        router.push("/admin/services");
      } finally {
        setFetching(false);
      }
    };
    if (isAdmin && id) fetchService();
  }, [isAdmin, id, router]);

  if (isLoading || fetching || !isAdmin) {
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

  if (!service) return null;

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
          Edit Service
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the details for{" "}
          <strong className="font-semibold text-white">
            {service.title}
          </strong>
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7">
        <ServiceForm
          mode="edit"
          serviceId={id}
          initialData={{
            title: service.title,
            category: service.category,
            description: service.description,
            pricePerDay: service.pricePerDay,
            location: service.location,
            contact: service.contact,
            tags: service.tags,
            images: service.images,
          }}
        />
      </div>
    </div>
  </div>
);
}
