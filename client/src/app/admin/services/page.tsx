"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit2, Trash2, MapPin, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Service } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminServicesPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchServices = async () => {
    try {
      const { data } = await api.get("/services?limit=50");
      setServices(data.data);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchServices();
  }, [isAdmin]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}"? This will hide it from users.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/services/${id}`);
      toast.success("Service removed");
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading || !isAdmin)
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

  return (
  <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
    {/* Background Glow */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/[0.03] blur-[100px]" />
    </div>

    <div className="relative z-10 mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Manage Services
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add, edit, and manage services on your platform
          </p>
        </div>

        <Link
          href="/admin/services/new"
          id="new-service-btn"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-[#050d1e] shadow-[0_8px_25px_rgba(250,204,21,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-[0_12px_30px_rgba(250,204,21,0.18)]"
        >
          <Plus size={16} />
          Add Service
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-6 text-center backdrop-blur-xl">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.06] text-3xl">
            🏛️
          </div>

          <h3 className="text-xl font-bold text-white">
            No services yet
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            You haven&apos;t added any services yet. Create your first service
            to start listing it on the platform.
          </p>

          <Link
            href="/admin/services/new"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-[#050d1e] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-300"
          >
            <Plus size={16} />
            Add Your First Service
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Header */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 backdrop-blur-xl lg:grid">
            <span>Service</span>
            <span>Category</span>
            <span>Location</span>
            <span>Price / Day</span>
            <span>Actions</span>
          </div>

          {services.map((svc) => (
            <div
              key={svc._id}
              id={`admin-service-${svc._id}`}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_12px_35px_rgba(0,0,0,0.18)] lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] lg:items-center lg:gap-4 lg:rounded-xl lg:p-5"
            >
              {/* Service */}
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-white">
                  {svc.title}
                </div>

                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {svc.description.slice(0, 60)}…
                </p>
              </div>

              {/* Category */}
              <div className="mt-4 lg:mt-0">
                  <span className="inline-flex items-center rounded-lg border border-purple-400/15 bg-purple-400/10 px-2.5 py-1 text-xs font-semibold capitalize text-purple-400">
                    {svc.category}
                  </span>
              </div>

              {/* Location */}
              <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-400 lg:mt-0">
                <MapPin size={14} className="shrink-0 text-slate-500" />
                <span>{svc.location.city}</span>
              </div>

              {/* Price */}
              <div className="mt-3 flex items-center gap-0.5 text-sm font-bold text-yellow-400 lg:mt-0">
                <IndianRupee size={14} />
                {new Intl.NumberFormat("en-IN").format(svc.pricePerDay)}
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4 lg:mt-0 lg:border-0 lg:pt-0">
                <Link
                  href={`/admin/services/${svc._id}/edit`}
                  id={`edit-service-${svc._id}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-blue-400/20 hover:bg-blue-400/10 hover:text-blue-300"
                >
                  <Edit2 size={13} />
                  Edit
                </Link>

                <button
                  id={`delete-service-${svc._id}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-400/10 bg-red-400/[0.05] px-3.5 text-xs font-semibold text-red-400 transition-all duration-200 hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleDelete(svc._id, svc.title)}
                  disabled={deleting === svc._id}
                >
                  <Trash2 size={13} />
                  {deleting === svc._id ? "…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}
