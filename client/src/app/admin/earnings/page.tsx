"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminEarnings } from "@/hooks/useAdminEarnings";
import { TransactionsTab } from "@/components/admin/earnings/TransactionsTab";
import { RevenueOverviewTab } from "@/components/admin/earnings/RevenueOverviewTab";
import { RefundsTab } from "@/components/admin/earnings/RefundsTab";
import { TransactionDetailModal } from "@/components/admin/earnings/TransactionDetailModal";
import { RefundModal } from "@/components/admin/earnings/RefundModal";
import { ReceiptModal } from "@/components/admin/earnings/ReceiptModal";

export default function AdminPaymentsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Auth Protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const {
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
    summaryData,
    summaryPeriod,
    setSummaryPeriod,
    loadingSummary,
    dailyPage,
    setDailyPage,
    servicesPage,
    setServicesPage,
    refundsList,
    loadingRefunds,
    refundsPage,
    setRefundsPage,
    refundsTotalPages,
    refundsTotalItems,
    selectedTx,
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
  } = useAdminEarnings(isAdmin);

  const handleClearFilters = () => {
    setSearch("");
    setPaymentStatusFilter("all");
    setBookingStatusFilter("all");
    setStartDate("");
    setEndDate("");
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
                  activeTab === "refunds" ? "refunds" : "transactions"
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
            className={`px-4 py-2.5 text-sm cursor-pointer font-semibold rounded-t-xl transition-all flex items-center gap-2 relative ${
              activeTab === "refunds"
                ? "text-yellow-400 bg-white/[0.06] border-b-2 border-yellow-400"
                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <RotateCcw size={16} />
            Refunds & Disputes
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            loadingTx={loadingTx}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
            bookingStatusFilter={bookingStatusFilter}
            onBookingStatusChange={setBookingStatusFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={handleClearFilters}
            onViewDetails={handleViewDetails}
            onOpenRefund={handleOpenRefund}
          />
        )}

        {activeTab === "overview" && (
          <RevenueOverviewTab
            summaryData={summaryData}
            loadingSummary={loadingSummary}
            summaryPeriod={summaryPeriod}
            onSummaryPeriodChange={setSummaryPeriod}
            dailyPage={dailyPage}
            onDailyPageChange={setDailyPage}
            servicesPage={servicesPage}
            onServicesPageChange={setServicesPage}
          />
        )}

        {activeTab === "refunds" && (
          <RefundsTab
            refundsList={refundsList}
            loadingRefunds={loadingRefunds}
            refundsPage={refundsPage}
            refundsTotalPages={refundsTotalPages}
            refundsTotalItems={refundsTotalItems}
            onPageChange={setRefundsPage}
            onExportCSV={() => handleExportCSV("refunds")}
          />
        )}
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        show={showDetailModal}
        selectedTx={selectedTx}
        stripeDetails={stripeDetails}
        loadingDetail={loadingDetail}
        onClose={() => setShowDetailModal(false)}
        onOpenReceipt={() => setShowReceiptModal(true)}
        onOpenRefund={handleOpenRefund}
      />

      {/* Issue Refund Modal */}
      <RefundModal
        refundTarget={refundTarget}
        refundType={refundType}
        onRefundTypeChange={setRefundType}
        refundAmount={refundAmount}
        onRefundAmountChange={setRefundAmount}
        refundReason={refundReason}
        onRefundReasonChange={setRefundReason}
        customReason={customReason}
        onCustomReasonChange={setCustomReason}
        isRefunding={isRefunding}
        onClose={() => setRefundTarget(null)}
        onSubmit={handleProcessRefund}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        selectedTx={selectedTx}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
