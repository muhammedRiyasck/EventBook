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
    <div className="page-wrapper pt-[100px] pb-[80px]">
      <div className="container">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1 text-[14px] text-slate-400 mb-6 transition-colors duration-200 hover:text-[var(--gold-400)]"
        >
          <ChevronLeft size={16} /> Back to Services
        </Link>
        <div className="mb-8">
          <h1 className="section-title">Edit Service</h1>
          <p className="section-subtitle" style={{ marginTop: 8 }}>
            Update the details for{" "}
            <strong style={{ color: "var(--white)" }}>{service.title}</strong>
          </p>
        </div>
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
  );
}
