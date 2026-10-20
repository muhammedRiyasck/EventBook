"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { RevenueSummaryData, StripeTransactionDetails } from "@/types";
import { EarningsTabType, PopulatedBooking } from "@/components/admin/earnings/types";

export function useAdminEarnings(isAdmin: boolean) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<EarningsTabType>("transactions");

  // Transactions State
  const [transactions, setTransactions] = useState<PopulatedBooking[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");

  // Summary State
  const [summaryData, setSummaryData] = useState<RevenueSummaryData | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState("30");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Dedicated Refunds State
  const [refundsList, setRefundsList] = useState<PopulatedBooking[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsTotalPages, setRefundsTotalPages] = useState(1);
  const [refundsTotalItems, setRefundsTotalItems] = useState(0);

  // Modals
  const [selectedTx, setSelectedTx] = useState<PopulatedBooking | null>(null);
  const [stripeDetails, setStripeDetails] = useState<StripeTransactionDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<PopulatedBooking | null>(null);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>(
    "Customer requested cancellation"
  );
  const [customReason, setCustomReason] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Invoice / Receipt print state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        sort: sortBy,
      });
      if (paymentStatusFilter !== "all")
        params.set("paymentStatus", paymentStatusFilter);
      if (bookingStatusFilter !== "all")
        params.set("status", bookingStatusFilter);
      if (search.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const { data } = await api.get(
        `/payments/transactions?${params.toString()}`
      );
      setTransactions(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTx(false);
    }
  }, [
    page,
    sortBy,
    paymentStatusFilter,
    bookingStatusFilter,
    search,
    startDate,
    endDate,
  ]);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get(
        `/payments/summary?period=${summaryPeriod}`
      );
      if (data.success) {
        setSummaryData(data.data);
      }
    } catch {
      toast.error("Failed to load revenue overview");
    } finally {
      setLoadingSummary(false);
    }
  }, [summaryPeriod]);

  // Fetch Refunds
  const fetchRefunds = useCallback(
    async (pg = refundsPage) => {
      setLoadingRefunds(true);
      try {
        const { data } = await api.get(`/payments/refunds?page=${pg}&limit=15`);
        setRefundsList(data.data || []);
        setRefundsTotalPages(data.pagination?.totalPages || 1);
        setRefundsTotalItems(data.pagination?.totalItems || 0);
      } catch {
        toast.error("Failed to load refunds history");
      } finally {
        setLoadingRefunds(false);
      }
    },
    [refundsPage]
  );

  // Effects for Tabs
  useEffect(() => {
    if (!isAdmin) return;
    void Promise.resolve().then(() => {
      if (activeTab === "transactions") fetchTransactions();
      if (activeTab === "overview") fetchSummary();
      if (activeTab === "refunds") fetchRefunds(refundsPage);
    });
  }, [
    isAdmin,
    activeTab,
    refundsPage,
    fetchTransactions,
    fetchSummary,
    fetchRefunds,
  ]);

  // Trigger search on debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin && activeTab === "transactions") {
        setPage(1);
        fetchTransactions();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [
    isAdmin,
    activeTab,
    search,
    paymentStatusFilter,
    bookingStatusFilter,
    startDate,
    endDate,
    sortBy,
    fetchTransactions,
  ]);

  // View Details
  const handleViewDetails = async (tx: PopulatedBooking) => {
    setSelectedTx(tx);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setStripeDetails(null);

    try {
      const { data } = await api.get(`/payments/transactions/${tx._id}`);
      if (data.success) {
        setSelectedTx(data.data);
        if (data.stripeDetails) {
          setStripeDetails(data.stripeDetails);
        }
      }
    } catch {
      // Continue with current booking data
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Refund Modal
  const handleOpenRefund = (tx: PopulatedBooking) => {
    setRefundTarget(tx);
    const alreadyRefunded = tx.refundAmount || 0;
    const remaining = Math.max(0, tx.totalPrice - alreadyRefunded);
    setRefundType("full");
    setRefundAmount(String(remaining));
    setRefundReason("Customer requested cancellation");
    setCustomReason("");
  };

  // Submit Refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    const alreadyRefunded = refundTarget.refundAmount || 0;
    const remaining = Math.max(0, refundTarget.totalPrice - alreadyRefunded);

    const amountNum =
      refundType === "full" ? remaining : parseFloat(refundAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    if (amountNum > remaining) {
      toast.error(
        `Refund amount cannot exceed remaining balance of ₹${remaining.toLocaleString("en-IN")}`
      );
      return;
    }

    const finalReason = refundReason === "Other" ? customReason : refundReason;

    setIsRefunding(true);
    try {
      const { data } = await api.post(
        `/payments/transactions/${refundTarget._id}/refund`,
        {
          amount: amountNum,
          reason: finalReason || "Admin processed refund",
        }
      );

      if (data.success) {
        toast.success(data.message || "Refund processed successfully!");
        setRefundTarget(null);
        fetchTransactions();
        if (activeTab === "overview") fetchSummary();
        if (activeTab === "refunds") fetchRefunds();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Refund failed";
      toast.error(message);
    } finally {
      setIsRefunding(false);
    }
  };

  // Export to CSV
  const handleExportCSV = (type: "transactions" | "refunds") => {
    const list = type === "transactions" ? transactions : refundsList;
    if (!list.length) {
      toast.error("No data available to export");
      return;
    }

    const headers = [
      "Booking ID",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Service Title",
      "Total Price (INR)",
      "Payment Status",
      "Booking Status",
      "Payment Gateway ID",
      "Refund Status",
      "Refund Amount (INR)",
      "Refund Reason",
      "Transaction Date",
    ];

    const rows = list.map((b) => [
      `"${b._id}"`,
      `"${b.user?.name || "N/A"}"`,
      `"${b.user?.email || "N/A"}"`,
      `"${b.user?.phone || "N/A"}"`,
      `"${b.service?.title || "N/A"}"`,
      b.totalPrice,
      b.paymentStatus,
      b.status,
      `"${b.stripePaymentIntentId || "N/A"}"`,
      b.refundStatus || "none",
      b.refundAmount || 0,
      `"${b.refundReason || ""}"`,
      `"${new Date(b.createdAt).toISOString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `eventbook_${type}_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} CSV report exported`
    );
  };

  return {
    activeTab,
    setActiveTab,
    transactions,
    loadingTx,
    page,
    setPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    bookingStatusFilter,
    setBookingStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    setSortBy,
    summaryData,
    summaryPeriod,
    setSummaryPeriod,
    loadingSummary,
    refundsList,
    loadingRefunds,
    refundsPage,
    setRefundsPage,
    refundsTotalPages,
    refundsTotalItems,
    selectedTx,
    setSelectedTx,
    stripeDetails,
    loadingDetail,
    showDetailModal,
    setShowDetailModal,
    refundTarget,
    setRefundTarget,
    refundType,
    setRefundType,
    refundAmount,
    setRefundAmount,
    refundReason,
    setRefundReason,
    customReason,
    setCustomReason,
    isRefunding,
    showReceiptModal,
    setShowReceiptModal,
    fetchTransactions,
    fetchSummary,
    fetchRefunds,
    handleViewDetails,
    handleOpenRefund,
    handleProcessRefund,
    handleExportCSV,
  };
}
