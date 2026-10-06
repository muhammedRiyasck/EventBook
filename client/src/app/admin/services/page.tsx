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
    <div className="page-wrapper pt-[100px] pb-[80px]">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">Manage Services</h1>
          <Link
            href="/admin/services/new"
            className="btn btn-primary"
            id="new-service-btn"
          >
            <Plus size={16} /> Add Service
          </Link>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <div className="spinner" />
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              No services yet
            </h3>
            <Link
              href="/admin/services/new"
              className="btn btn-primary"
              style={{ marginTop: 20 }}
            >
              Add your first service
            </Link>
          </div>
        ) : (
          <div className="bg-white/2 border border-white/10 rounded-lg overflow-hidden lg:bg-white/2 lg:border-white/10 max-lg:bg-transparent max-lg:border-none max-lg:overflow-visible">
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 py-3.5 px-5 bg-white/4 border-b border-white/10 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Service</span>
              <span>Category</span>
              <span>Location</span>
              <span>Price/Day</span>
              <span>Actions</span>
            </div>
            {services.map((svc) => (
              <div
                key={svc._id}
                className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 py-4 px-5 border-b border-white/4 items-center transition-colors duration-150 animate-[fadeIn_0.3s_ease] last:border-b-0 hover:bg-white/3 max-lg:border max-lg:border-white/10 max-lg:rounded-md max-lg:mb-3"
                id={`admin-service-${svc._id}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-semibold text-white">
                    {svc.title}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {svc.description.slice(0, 60)}…
                  </span>
                </div>
                <div>
                  <span className={`badge badge-${svc.category}`}>
                    {svc.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-slate-400">
                  <MapPin size={12} /> {svc.location.city}
                </div>
                <div className="flex items-center gap-0.5 text-[14px] font-bold text-[var(--gold-400)]">
                  <IndianRupee size={13} />
                  {new Intl.NumberFormat("en-IN").format(svc.pricePerDay)}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/admin/services/${svc._id}/edit`}
                    className="btn btn-secondary btn-sm"
                    id={`edit-service-${svc._id}`}
                  >
                    <Edit2 size={13} /> Edit
                  </Link>
                  <button
                    id={`delete-service-${svc._id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(svc._id, svc.title)}
                    disabled={deleting === svc._id}
                  >
                    <Trash2 size={13} /> {deleting === svc._id ? "…" : "Remove"}
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
