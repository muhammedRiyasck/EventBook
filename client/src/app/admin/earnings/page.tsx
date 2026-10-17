"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Search,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
  Printer,
  X,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Receipt,
  Layers,
  ArrowDownLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  Booking,
  Service,
  User as UserType,
  RevenueSummaryData,
  StripeTransactionDetails,
} from "@/types";
import { useAuth } from "@/context/AuthContext";

type TabType = "transactions" | "overview" | "refunds" | "reports";

interface PopulatedBooking extends Omit<Booking, "user" | "service"> {
  user: UserType;
  service: Service;
}

export default function AdminPaymentsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>("transactions");

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
  const [summaryData, setSummaryData] = useState<RevenueSummaryData | null>(
    null,
  );
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
  const [stripeDetails, setStripeDetails] =
    useState<StripeTransactionDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<PopulatedBooking | null>(
    null,
  );
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>(
    "Customer requested cancellation",
  );
  const [customReason, setCustomReason] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Invoice / Receipt print state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const searchInputId = useId();
  const paymentStatusFilterId = useId();
  const bookingStatusFilterId = useId();
  const startDateFilterId = useId();
  const endDateFilterId = useId();
  const sortByFilterId = useId();
  const summaryPeriodSelectId = useId();
  const refundAmountInputId = useId();
  const refundReasonSelectId = useId();
  const customReasonInputId = useId();

  // Auth Protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

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
        `/payments/transactions?${params.toString()}`,
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
        `/payments/summary?period=${summaryPeriod}`,
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
    [refundsPage],
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
    search,
    paymentStatusFilter,
    bookingStatusFilter,
    startDate,
    endDate,
    sortBy,
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
        `Refund amount cannot exceed remaining balance of ₹${remaining.toLocaleString("en-IN")}`,
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
        },
      );

      if (data.success) {
        toast.success(data.message || "Refund processed successfully!");
        setRefundTarget(null);
        // Refresh active views
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
      `eventbook_${type}_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} CSV report exported`,
    );
  };

  // Format Helpers
  const formatCurrency = (amt: number = 0) =>
    "₹" + amt.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Badge helpers
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Paid
          </span>
        );
      case "partially_refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw size={12} /> Partially Refunded
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <RotateCcw size={12} /> Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
    }
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050d1e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/admin/dashboard"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 hover:text-yellow-400 transition-colors"
              >
                Administration
              </Link>
              <span className="text-xs text-slate-600">/</span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
                Payments & Gateway
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center gap-3">
              Payments & Finance
              <span className="text-xs px-2.5 py-1 rounded-md bg-yellow-400/10 text-yellow-400 font-semibold border border-yellow-400/20 tracking-normal">
                Online Gateway
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time gateway transactions, automated revenue tracking,
              receipts, and Stripe refunds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() =>
                handleExportCSV(
                  activeTab === "refunds" ? "refunds" : "transactions",
                )
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-yellow-400/30 hover:bg-white/[0.08] hover:text-white transition-all shadow-sm"
              title="Export filtered records to CSV"
            >
              <Download size={14} className="text-yellow-400" />
              Export CSV
            </button>
            <button
              onClick={() => {
                if (activeTab === "transactions") fetchTransactions();
                if (activeTab === "overview") fetchSummary();
                if (activeTab === "refunds") fetchRefunds();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition-all"
            >
              <RefreshCw
                size={14}
                className={
                  loadingTx || loadingSummary || loadingRefunds
                    ? "animate-spin text-yellow-400"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-7 flex border-b border-white/[0.08] gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2.5 cursor-pointer text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
              activeTab === "transactions"
                ? "text-yellow-400 bg-white/[0.06] border-b-2 border-yellow-400"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <CreditCard size={16} />
            Transactions
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-normal">
              {totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm cursor-pointer font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
              activeTab === "overview"
                ? "text-yellow-400 bg-white/[0.06] border-b-2 border-yellow-400"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <TrendingUp size={16} />
            Revenue & Summary
          </button>

          <button
            onClick={() => setActiveTab("refunds")}
            className={`px-4 py-2.5 text-sm cursor-pointer  font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
              activeTab === "refunds"
                ? "text-yellow-400 bg-white/[0.06] border-b-2 border-yellow-400"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <RotateCcw size={16} />
            Refunds & Disputes
          </button>
        </div>

        {/* ========================================================================================= */}
        {/* TAB 1: TRANSACTIONS LIST */}
        {/* ========================================================================================= */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-xl md:grid-cols-12">
              {/* Search input */}
              <div className="relative md:col-span-4">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Search customer, booking ID, or Stripe PI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20"
                />
              </div>

              {/* Payment Status */}
              <div className="md:col-span-2">
                <select
                  id={paymentStatusFilterId}
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="h-10 cursor-pointer w-full rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none transition-all focus:border-yellow-400/40"
                >
                  <option value="all">All Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="partially_refunded">Partially Refunded</option>
                  <option value="refunded">Fully Refunded</option>
                </select>
              </div>

              {/* Booking Status */}
              <div className="md:col-span-2">
                <select
                  id={bookingStatusFilterId}
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none transition-all focus:border-yellow-400/40"
                >
                  <option value="all">All Booking Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2 md:col-span-3">
                <input
                  id={startDateFilterId}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-1/2 cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-2.5 text-xs text-slate-300 outline-none focus:border-yellow-400/40"
                  title="Start Date"
                />
                <input
                  id={endDateFilterId}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-1/2 cursor-pointer rounded-xl border border-white/[0.09] bg-[#0a1628] px-2.5 text-xs text-slate-300 outline-none focus:border-yellow-400/40"
                  title="End Date"
                />
              </div>

              {/* Clear / Sort */}
              <div className="flex items-center gap-2 md:col-span-1">
                {(search ||
                  paymentStatusFilter !== "all" ||
                  bookingStatusFilter !== "all" ||
                  startDate ||
                  endDate) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPaymentStatusFilter("all");
                      setBookingStatusFilter("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="h-10 px-2 cursor-pointer  rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors w-full flex items-center justify-center gap-1"
                    title="Reset filters"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Transaction / ID</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Gateway Status</th>
                      <th className="py-3.5 px-4">Booking Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-slate-300">
                    {loadingTx ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="inline-flex items-center gap-2 text-slate-400">
                            <div className="w-5 h-5 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                            Loading online transactions...
                          </div>
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-16 text-center text-slate-400"
                        >
                          <div className="max-w-sm mx-auto space-y-2">
                            <CreditCard
                              className="mx-auto text-slate-600"
                              size={36}
                            />
                            <p className="text-sm font-semibold text-white">
                              No transactions found
                            </p>
                            <p className="text-xs text-slate-500">
                              No payments match the current search or filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => {
                        const remaining = Math.max(
                          0,
                          tx.totalPrice - (tx.refundAmount || 0),
                        );
                        const canRefund =
                          tx.paymentStatus === "paid" ||
                          (tx.paymentStatus === "partially_refunded" &&
                            remaining > 0);

                        return (
                          <tr
                            key={tx._id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            {/* Booking ID & Gateway reference */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-white font-semibold">
                                #{tx._id.slice(-6).toUpperCase()}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                {tx.stripePaymentIntentId ? (
                                  <span
                                    className="truncate max-w-[120px]"
                                    title={tx.stripePaymentIntentId}
                                  >
                                    {tx.stripePaymentIntentId.slice(0, 14)}...
                                  </span>
                                ) : (
                                  <span className="text-amber-500/70">
                                    Gateway record
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-white">
                                {tx.user?.name || "Customer"}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {tx.user?.email || "—"}
                              </div>
                            </td>

                            {/* Service */}
                            <td className="py-3.5 px-4">
                              <div
                                className="font-medium text-white max-w-[170px] truncate"
                                title={tx.service?.title}
                              >
                                {tx.service?.title || "Service"}
                              </div>
                              <div className="text-[11px] text-slate-400 capitalize">
                                {tx.service?.category || "General"}
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-[13px]">
                                {formatCurrency(tx.totalPrice)}
                              </div>
                              {tx.refundAmount && tx.refundAmount > 0 ? (
                                <div className="text-[10px] text-rose-400 mt-0.5">
                                  - {formatCurrency(tx.refundAmount)} refunded
                                </div>
                              ) : null}
                            </td>

                            {/* Payment Status */}
                            <td className="py-3.5 px-4">
                              {getPaymentStatusBadge(tx.paymentStatus)}
                            </td>

                            {/* Booking Status */}
                            <td className="py-3.5 px-4">
                              {getBookingStatusBadge(tx.status)}
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {formatDateTime(tx.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewDetails(tx)}
                                  className="px-2.5 py-1.5 cursor-pointer rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium transition-colors"
                                  title="View details & receipt"
                                >
                                  Details
                                </button>
                                {canRefund && (
                                  <button
                                    onClick={() => handleOpenRefund(tx)}
                                    className="px-2.5 py-1.5 cursor-pointer rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors"
                                    title="Issue full or partial refund via gateway"
                                  >
                                    Refund
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-4 py-3">
                  <span className="text-xs text-slate-400">
                    Page{" "}
                    <span className="text-white font-semibold">{page}</span> of{" "}
                    <span className="text-white font-semibold">
                      {totalPages}
                    </span>{" "}
                    ({totalItems} total transactions)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* TAB 2: OVERVIEW & REVENUE SUMMARY */}
        {/* ========================================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Period selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Revenue Overview & Metrics
                </h2>
                <p className="text-xs text-slate-400">
                  Aggregated payments and net settled figures from online
                  bookings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor={summaryPeriodSelectId}
                  className="text-xs text-slate-400"
                >
                  Time Window:
                </label>
                <select
                  id={summaryPeriodSelectId}
                  value={summaryPeriod}
                  onChange={(e) => setSummaryPeriod(e.target.value)}
                  className="h-9 rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-200 outline-none"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">Last 365 Days</option>
                </select>
              </div>
            </div>

            {/* Metrics cards */}
            {loadingSummary || !summaryData ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-6 h-6 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-2" />
                Calculating revenue summaries...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Gross Revenue */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Gross Revenue
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">
                      {formatCurrency(summaryData?.overview?.totalRevenue)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      From {summaryData?.overview?.totalTransactions} successful
                      transactions
                    </div>
                  </div>

                  {/* Net Revenue */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Net Settled Revenue
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center">
                        <IndianRupee size={16} />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-yellow-400">
                      {formatCurrency(summaryData?.overview?.netRevenue)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      After deducting refunds
                    </div>
                  </div>

                  {/* Total Refunds */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Total Refunded
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <RotateCcw size={16} />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-rose-400">
                      {formatCurrency(summaryData.overview?.refundedRevenue)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Across {summaryData.refundStats?.count} refund orders
                    </div>
                  </div>

                  {/* Period Revenue */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Window Revenue
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black text-blue-400">
                      {formatCurrency(summaryData.overview?.periodRevenue)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Last {summaryPeriod} days volume
                    </div>
                  </div>
                </div>

                {/* Daily Breakdown & Top Services */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Daily Revenue Table */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-yellow-400" />
                      Daily Payment Activity ({summaryPeriod}d)
                    </h3>

                    {summaryData.dailyRevenue.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">
                        No transactions recorded in this window.
                      </p>
                    ) : (
                      <div className="overflow-x-auto max-h-[360px]">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-white/[0.06] text-slate-400 text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Bookings</th>
                              <th className="py-2.5 px-3">Gross Revenue</th>
                              <th className="py-2.5 px-3">Refunds</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {summaryData.dailyRevenue.map((d) => (
                              <tr key={d._id} className="hover:bg-white/[0.02]">
                                <td className="py-2 px-3 font-mono text-slate-300">
                                  {d._id}
                                </td>
                                <td className="py-2 px-3 font-semibold text-white">
                                  {d.count}
                                </td>
                                <td className="py-2 px-3 font-semibold text-emerald-400">
                                  {formatCurrency(d.revenue)}
                                </td>
                                <td className="py-2 px-3 text-rose-400">
                                  {d.refunds > 0
                                    ? formatCurrency(d.refunds)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Top Revenue Services */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-yellow-400" />
                      Top Revenue Generating Services
                    </h3>

                    {summaryData.topServices.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">
                        No service revenue recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {summaryData.topServices.map((svc, idx) => (
                          <div
                            key={svc._id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-md bg-yellow-400/10 text-yellow-400 flex items-center justify-center font-bold text-xs">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold text-xs text-white max-w-[200px] truncate">
                                  {svc.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {svc.category} • {svc.bookings} bookings
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xs text-yellow-400">
                                {formatCurrency(svc.revenue)}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Collected
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================================= */}
        {/* TAB 3: REFUNDS & DISPUTES */}
        {/* ========================================================================================= */}
        {activeTab === "refunds" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Refund History & Audit Log
                </h2>
                <p className="text-xs text-slate-400">
                  All customer refund requests executed through the Stripe
                  gateway.
                </p>
              </div>

              <button
                onClick={() => handleExportCSV("refunds")}
                className="inline-flex cursor-pointer  items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-slate-300 hover:text-white"
              >
                <Download size={13} /> Export Refunds
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Booking ID</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Refund Amount</th>
                      <th className="py-3.5 px-4">Total Booking</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-slate-300">
                    {loadingRefunds ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-16 text-center text-slate-400"
                        >
                          <div className="inline-flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                            Loading refund audit log...
                          </div>
                        </td>
                      </tr>
                    ) : refundsList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-16 text-center text-slate-400"
                        >
                          <RotateCcw
                            className="mx-auto text-slate-600 mb-2"
                            size={32}
                          />
                          <p className="text-sm font-semibold text-white">
                            No refunds recorded
                          </p>
                          <p className="text-xs text-slate-500">
                            No transactions have been refunded yet.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      refundsList.map((rf) => (
                        <tr
                          key={rf._id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            #{rf._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white">
                              {rf.user?.name || "Customer"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {rf.user?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white">
                              {rf.service?.title}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              {rf.service?.category}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-400 text-[13px]">
                            {formatCurrency(rf.refundAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {formatCurrency(rf.totalPrice)}
                          </td>
                          <td
                            className="py-3.5 px-4 max-w-[200px] truncate text-slate-300"
                            title={rf.refundReason}
                          >
                            {rf.refundReason || "No reason specified"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={11} /> Succeeded
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {rf.refundedAt
                              ? formatDateTime(rf.refundedAt)
                              : formatDateTime(rf.updatedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Refunds Pagination */}
              {refundsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-4 py-3">
                  <span className="text-xs text-slate-400">
                    Page{" "}
                    <span className="text-white font-semibold">
                      {refundsPage}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-semibold">
                      {refundsTotalPages}
                    </span>{" "}
                    ({refundsTotalItems} total refunds)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRefundsPage((p) => Math.max(1, p - 1))}
                      disabled={refundsPage === 1}
                      className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setRefundsPage((p) =>
                          Math.min(refundsTotalPages, p + 1),
                        )
                      }
                      disabled={refundsPage === refundsTotalPages}
                      className="p-1.5 cursor-pointer rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* TRANSACTION DETAIL MODAL */}
        {/* ========================================================================================= */}
        {showDetailModal && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#09152b] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Close */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-5 cursor-pointer  right-5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                  Transaction Breakdown
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  #{selectedTx._id}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-4">
                Booking #{selectedTx._id.slice(-6).toUpperCase()}
              </h2>

              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-2" />
                  Fetching gateway charge details...
                </div>
              ) : (
                <div className="space-y-5 text-xs">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1">
                        Payment Status:
                      </span>
                      {getPaymentStatusBadge(selectedTx.paymentStatus)}
                    </div>
                    <div className="ml-6">
                      <span className="text-slate-400 text-[11px] block mb-1">
                        Booking Status:
                      </span>
                      {getBookingStatusBadge(selectedTx.status)}
                    </div>
                    {selectedTx.refundStatus &&
                      selectedTx.refundStatus !== "none" && (
                        <div className="ml-6">
                          <span className="text-slate-400 text-[11px] block mb-1">
                            Refund Status:
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {selectedTx.refundStatus.toUpperCase()} (
                            {formatCurrency(selectedTx.refundAmount)})
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Customer & Service Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                      <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                        <User size={14} /> Customer Information
                      </h3>
                      <div>
                        <span className="text-slate-400 text-[11px]">
                          Name:
                        </span>{" "}
                        <span className="text-white font-medium">
                          {selectedTx.user?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">
                          Email:
                        </span>{" "}
                        <span className="text-white">
                          {selectedTx.user?.email || "N/A"}
                        </span>
                      </div>
                      {selectedTx.user?.phone && (
                        <div>
                          <span className="text-slate-400 text-[11px]">
                            Phone:
                          </span>{" "}
                          <span className="text-white">
                            {selectedTx.user.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                      <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                        <Layers size={14} /> Service Details
                      </h3>
                      <div>
                        <span className="text-slate-400 text-[11px]">
                          Title:
                        </span>{" "}
                        <span className="text-white font-medium">
                          {selectedTx.service?.title}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">
                          Schedule:
                        </span>{" "}
                        <span className="text-white">
                          {formatDate(selectedTx.startDate)} —{" "}
                          {formatDate(selectedTx.endDate)}
                        </span>
                      </div>
                      {selectedTx.startTime && (
                        <div>
                          <span className="text-slate-400 text-[11px]">
                            Slot:
                          </span>{" "}
                          <span className="text-white">
                            {selectedTx.startTime} - {selectedTx.endTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gateway Payment Details */}
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-3">
                    <h3 className="font-semibold text-white flex items-center gap-1.5 text-xs text-yellow-400">
                      <ShieldCheck size={14} /> Gateway & Stripe Details
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Payment Intent ID:
                        </span>
                        <span
                          className="font-mono text-white text-[11px] truncate block"
                          title={selectedTx.stripePaymentIntentId}
                        >
                          {selectedTx.stripePaymentIntentId || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Payment Method:
                        </span>
                        <span className="text-white capitalize">
                          {stripeDetails?.brand
                            ? `${stripeDetails.brand} (•••• ${stripeDetails.last4})`
                            : "Credit / Debit Card"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Settled Amount:
                        </span>
                        <span className="text-white font-bold">
                          {formatCurrency(selectedTx.totalPrice)}
                        </span>
                      </div>
                    </div>

                    {stripeDetails?.receiptUrl && (
                      <div className="pt-2">
                        <a
                          href={stripeDetails.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-yellow-400 hover:underline text-xs"
                        >
                          <Receipt size={14} /> View Official Stripe Gateway
                          Hosted Receipt <ArrowUpRight size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium transition-colors"
                    >
                      <Printer size={14} /> Generate Printable Invoice
                    </button>
                    {selectedTx.paymentStatus === "paid" && (
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleOpenRefund(selectedTx);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium border border-rose-500/20 transition-colors"
                      >
                        <RotateCcw size={14} /> Issue Refund
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* REFUND MODAL */}
        {/* ========================================================================================= */}
        {refundTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/20 bg-[#09152b] p-6 shadow-2xl">
              <button
                onClick={() => setRefundTarget(null)}
                className="absolute top-5 cursor-pointer right-5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Payment Gateway Action
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Issue Online Refund
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                The refund will be directly processed via Stripe and returned to
                the customer&apos;s original payment method.
              </p>

              <form
                onSubmit={handleProcessRefund}
                className="space-y-4 text-xs"
              >
                {/* Booking summary box */}
                <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="text-white font-medium">
                      {refundTarget.user?.name} ({refundTarget.user?.email})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="text-white font-medium">
                      {refundTarget.service?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Paid:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(refundTarget.totalPrice)}
                    </span>
                  </div>
                  {refundTarget.refundAmount ? (
                    <div className="flex justify-between text-rose-400">
                      <span>Already Refunded:</span>
                      <span>{formatCurrency(refundTarget.refundAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/[0.06] pt-1.5 font-semibold">
                    <span className="text-slate-300">Remaining Balance:</span>
                    <span className="text-emerald-400">
                      {formatCurrency(
                        Math.max(
                          0,
                          refundTarget.totalPrice -
                            (refundTarget.refundAmount || 0),
                        ),
                      )}
                    </span>
                  </div>
                </div>

                {/* Refund Type Selector */}
                <div>
                  <label className="text-slate-300 font-semibold mb-2 block">
                    Refund Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRefundType("full");
                        const rem = Math.max(
                          0,
                          refundTarget.totalPrice -
                            (refundTarget.refundAmount || 0),
                        );
                        setRefundAmount(String(rem));
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        refundType === "full"
                          ? "border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                      }`}
                    >
                      Full Refund
                      <span className="block cursor-pointer text-[11px] font-normal text-slate-400 mt-0.5">
                        {formatCurrency(
                          Math.max(
                            0,
                            refundTarget.totalPrice -
                              (refundTarget.refundAmount || 0),
                          ),
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundType("partial")}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        refundType === "partial"
                          ? "border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold"
                          : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                      }`}
                    >
                      Partial Refund
                      <span className="block cursor-pointer text-[11px] font-normal text-slate-400 mt-0.5">
                        Specify custom amount
                      </span>
                    </button>
                  </div>
                </div>

                {/* Partial Amount Input */}
                {refundType === "partial" && (
                  <div>
                    <label
                      htmlFor={refundAmountInputId}
                      className="text-slate-300 font-semibold mb-1 block"
                    >
                      Partial Refund Amount (₹):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        ₹
                      </span>
                      <input
                        id={refundAmountInputId}
                        type="number"
                        step="0.01"
                        min="1"
                        max={Math.max(
                          0,
                          refundTarget.totalPrice -
                            (refundTarget.refundAmount || 0),
                        )}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] pl-8 pr-4 text-xs text-white outline-none focus:border-rose-400/40"
                        placeholder="Enter amount to refund..."
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Reason Dropdown */}
                <div>
                  <label
                    htmlFor={refundReasonSelectId}
                    className="text-slate-300 font-semibold mb-1 block"
                  >
                    Reason for Refund:
                  </label>
                  <select
                    id={refundReasonSelectId}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-300 outline-none"
                  >
                    <option value="Customer requested cancellation">
                      Customer requested cancellation
                    </option>
                    <option value="Service unavailable or rescheduling conflict">
                      Service unavailable or rescheduling conflict
                    </option>
                    <option value="Billing dispute or accidental duplicate">
                      Billing dispute or accidental duplicate
                    </option>
                    <option value="Mutual agreement / satisfaction guarantee">
                      Mutual agreement / satisfaction guarantee
                    </option>
                    <option value="Other">Other (Custom reason)</option>
                  </select>
                </div>

                {refundReason === "Other" && (
                  <div>
                    <label
                      htmlFor={customReasonInputId}
                      className="text-slate-300 font-semibold mb-1 block"
                    >
                      Custom Reason Notes:
                    </label>
                    <textarea
                      id={customReasonInputId}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Explain the reason for issuing this refund..."
                      rows={2}
                      className="w-full rounded-xl border border-white/[0.09] bg-[#0a1628] p-3 text-xs text-white outline-none focus:border-rose-400/40"
                      required
                    />
                  </div>
                )}

                {/* Notice banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    The customer will automatically receive a detailed refund
                    confirmation email with invoice reference and expected
                    arrival timeline (5-10 business days).
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setRefundTarget(null)}
                    className="px-4 py-2 cursor-pointer rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRefunding}
                    className="px-5 py-2 cursor-pointer rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRefunding ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        Processing via Stripe...
                      </>
                    ) : (
                      <>Confirm & Process Refund</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* PRINTABLE RECEIPT / INVOICE MODAL */}
        {/* ========================================================================================= */}
        {showReceiptModal && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white text-slate-900 p-8 shadow-2xl max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none">
              {/* Header Action Controls (Hidden on Print) */}
              <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tax Invoice / Official Receipt
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex cursor-pointer items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="p-1.5 rounded-lg cursor-pointer  text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Invoice Printable Content */}
              <div id="printable-receipt" className="space-y-6 text-sm">
                {/* Brand & Invoice Meta */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      EventBook
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Online Event & Venue Booking Platform
                    </p>
                    <p className="text-xs text-slate-500">
                      support@eventbook.com
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-slate-400">
                      INVOICE NUMBER
                    </span>
                    <p className="font-mono font-bold text-base text-slate-900">
                      INV-{selectedTx._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Date: {formatDate(selectedTx.createdAt)}
                    </p>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      Status: PAID (GATEWAY)
                    </p>
                  </div>
                </div>

                {/* Billed To & Service Details */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Billed To
                    </h4>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedTx.user?.name}
                    </p>
                    <p className="text-slate-600">{selectedTx.user?.email}</p>
                    {selectedTx.user?.phone && (
                      <p className="text-slate-600">
                        Phone: {selectedTx.user.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                      Booking Reference
                    </h4>
                    <p className="font-mono text-slate-900">
                      ID: {selectedTx._id}
                    </p>
                    <p className="text-slate-600">
                      Event Dates: {formatDate(selectedTx.startDate)} to{" "}
                      {formatDate(selectedTx.endDate)}
                    </p>
                    {selectedTx.startTime && (
                      <p className="text-slate-600">
                        Slot: {selectedTx.startTime} - {selectedTx.endTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Service Description</th>
                      <th className="py-2.5 px-3">Duration / Units</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">
                          {selectedTx.service?.title}
                        </span>
                        <p className="text-slate-500 text-[11px]">
                          {selectedTx.service?.category} booking
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {selectedTx.totalDays} day(s)
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurrency(selectedTx.totalPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(selectedTx.totalPrice)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50/50">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-right font-bold text-slate-700"
                      >
                        Subtotal:
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(selectedTx.totalPrice)}
                      </td>
                    </tr>
                    {selectedTx.refundAmount && selectedTx.refundAmount > 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2 px-3 text-right font-semibold text-rose-600"
                        >
                          Refund Issued:
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">
                          - {formatCurrency(selectedTx.refundAmount)}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-slate-300">
                      <td
                        colSpan={3}
                        className="py-3 px-3 text-right font-black text-slate-900 text-sm"
                      >
                        Net Settled:
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(
                          Math.max(
                            0,
                            selectedTx.totalPrice -
                              (selectedTx.refundAmount || 0),
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payment Gateway Footer */}
                <div className="pt-4 border-t text-[11px] text-slate-500 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">
                      Payment Gateway:
                    </span>{" "}
                    Online via Stripe Payments
                  </p>
                  {selectedTx.stripePaymentIntentId && (
                    <p className="font-mono">
                      <span className="font-semibold text-slate-700">
                        Gateway Transaction ID:
                      </span>{" "}
                      {selectedTx.stripePaymentIntentId}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 pt-2">
                    This is an electronically generated invoice and does not
                    require a physical signature. Thank you for choosing
                    EventBook.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
