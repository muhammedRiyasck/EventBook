"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking, Pagination } from "@/types";

export type TabType = "all" | "upcoming" | "past" | "cancelled";

export function useUserBookings(isAuthenticated: boolean) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (tab: TabType, pg = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pg), limit: "10" });
        if (tab !== "all") params.set("type", tab);
        const { data } = await api.get(`/bookings/my?${params.toString()}`);
        setBookings(data.data || []);
        setPagination(data.pagination || null);
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    void Promise.resolve().then(() => {
      fetchBookings(activeTab, page);
    });
  }, [activeTab, page, isAuthenticated, fetchBookings]);

  const handleConfirmCancel = async (reason: string) => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      const { data } = await api.patch(
        `/bookings/${cancellingBooking._id}/cancel`,
        {
          reason: reason.trim() || undefined,
        }
      );
      toast.success(data?.message || "Booking cancelled successfully");
      setCancellingBooking(null);
      fetchBookings(activeTab);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Cancellation failed");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryPayment = async (bookingId: string) => {
    setRetrying(bookingId);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/retry-payment`);

      // Booking was confirmed server-side (webhook missed but payment succeeded)
      if (data.alreadyConfirmed) {
        toast.success(
          data.message ||
            "Booking confirmed! Your payment was already processed."
        );
        fetchBookings(activeTab);
        return;
      }

      // Payment still processing — webhook should confirm it shortly
      if (data.processing) {
        toast.success(
          data.message || "Payment is being processed. Check back shortly."
        );
        fetchBookings(activeTab);
        return;
      }

      if (!data.clientSecret)
        throw new Error("Payment session was not created");

      router.push(
        `/checkout?clientSecret=${encodeURIComponent(data.clientSecret)}&bookingId=${bookingId}`
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Unable to retry payment");
    } finally {
      setRetrying(null);
    }
  };

  return {
    bookings,
    pagination,
    page,
    setPage,
    loading,
    activeTab,
    setActiveTab,
    cancellingBooking,
    setCancellingBooking,
    isCancelling,
    retrying,
    fetchBookings,
    handleConfirmCancel,
    handleRetryPayment,
  };
}
