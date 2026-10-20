import React, { useId } from "react";
import { TrendingUp, IndianRupee, RotateCcw, Calendar, Layers } from "lucide-react";
import { RevenueSummaryData } from "@/types";
import { formatCurrency } from "@/utils/formatters";

interface RevenueOverviewTabProps {
  summaryData: RevenueSummaryData | null;
  loadingSummary: boolean;
  summaryPeriod: string;
  onSummaryPeriodChange: (val: string) => void;
}

export const RevenueOverviewTab: React.FC<RevenueOverviewTabProps> = ({
  summaryData,
  loadingSummary,
  summaryPeriod,
  onSummaryPeriodChange,
}) => {
  const summaryPeriodSelectId = useId();

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Revenue Overview & Metrics
          </h2>
          <p className="text-xs text-slate-400">
            Aggregated payments and net settled figures from online bookings.
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
            onChange={(e) => onSummaryPeriodChange(e.target.value)}
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
                {formatCurrency(summaryData.overview?.totalRevenue)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                From {summaryData.overview?.totalTransactions} successful
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
                {formatCurrency(summaryData.overview?.netRevenue)}
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
                            {d.refunds > 0 ? formatCurrency(d.refunds) : "—"}
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
  );
};

export default RevenueOverviewTab;
