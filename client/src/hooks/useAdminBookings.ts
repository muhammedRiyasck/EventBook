"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Booking } from "@/types";

export type StatusAction = "cancelled" | "completed";

export interface ActiveStatusAction {
  booking: Booking;
  status: StatusAction;
}

export function useAdminBookings(isAdmin: boolean) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<ActiveStatusAction | null>(null);
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(async (pg = 1, status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "15" });
      if (status) params.set("status", status);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      setBookings(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchBookings(page, statusFilter);
    }
  }, [isAdmin, page, statusFilter, fetchBookings]);

  const updateStatus = async (
    bookingId: string,
    status: StatusAction,
    statusReason?: string
  ) => {
    setUpdatingId(bookingId);
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/status`, {
        status,
        ...(statusReason && { reason: statusReason }),
      });
      toast.success(`Booking marked as ${status}`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data.data : b))
      );
      setStatusAction(null);
      setReason("");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Status update failed";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openStatusAction = (booking: Booking, status: StatusAction) => {
    setReason("");
    setStatusAction({ booking, status });
  };

  const submitStatusAction = () => {
    if (!statusAction) return;
    if (statusAction.status === "cancelled" && !reason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }
    updateStatus(statusAction.booking._id, statusAction.status, reason.trim());
  };

  return {
    bookings,
    loading,
    statusFilter,
    setStatusFilter,
    updatingId,
    statusAction,
    setStatusAction,
    reason,
    setReason,
    page,
    setPage,
    totalPages,
    openStatusAction,
    submitStatusAction,
    fetchBookings,
  };
}
