import React, { useId } from "react";
import { TrendingUp, IndianRupee, RotateCcw, Calendar, Layers } from "lucide-react";
import { RevenueSummaryData, Pagination as PaginationMeta } from "@/types";
import { formatCurrency } from "@/utils/formatters";
import { Pagination } from "@/components/ui/Pagination";

interface RevenueOverviewTabProps {
  summaryData: RevenueSummaryData | null;
  loadingSummary: boolean;
  summaryPeriod: string;
  onSummaryPeriodChange: (val: string) => void;
  dailyPage: number;
  onDailyPageChange: (page: number) => void;
  servicesPage: number;
  onServicesPageChange: (page: number) => void;
}

export const RevenueOverviewTab: React.FC<RevenueOverviewTabProps> = ({
  summaryData,
  loadingSummary,
  summaryPeriod,
  onSummaryPeriodChange,
  dailyPage,
  onDailyPageChange,
  servicesPage,
  onServicesPageChange,
}) => {
  const summaryPeriodSelectId = useId();
  const dailyPagination: PaginationMeta | undefined = summaryData?.dailyPagination;
  const servicesPagination: PaginationMeta | undefined = summaryData?.servicesPagination;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Revenue Overview &amp; Metrics</h2>
          <p className="text-xs text-slate-400">Aggregated payments and net settled figures from online bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={summaryPeriodSelectId} className="text-xs text-slate-400">Time Window:</label>
          <select id={summaryPeriodSelectId} value={summaryPeriod} onChange={(e) => onSummaryPeriodChange(e.target.value)} className="h-9 rounded-xl border border-white/[0.09] bg-[#0a1628] px-3 text-xs text-slate-200 outline-none">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last 365 Days</option>
          </select>
        </div>
      </div>

      {loadingSummary || !summaryData ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-6 h-6 rounded-full border-2 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-2" />
          Calculating revenue summaries...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><TrendingUp size={16} /></div>
              </div>
              <div className="mt-3 text-2xl font-black text-white">{formatCurrency(summaryData.overview?.totalRevenue)}</div>
              <div className="mt-1 text-xs text-slate-400">From {summaryData.overview?.totalTransactions} successful transactions</div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Settled Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center"><IndianRupee size={16} /></div>
              </div>
              <div className="mt-3 text-2xl font-black text-yellow-400">{formatCurrency(summaryData.overview?.netRevenue)}</div>
              <div className="mt-1 text-xs text-slate-400">After deducting refunds</div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Refunded</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center"><RotateCcw size={16} /></div>
              </div>
              <div className="mt-3 text-2xl font-black text-rose-400">{formatCurrency(summaryData.overview?.refundedRevenue)}</div>
              <div className="mt-1 text-xs text-slate-400">Across {summaryData.refundStats?.count} refund orders</div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Window Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Calendar size={16} /></div>
              </div>
              <div className="mt-3 text-2xl font-black text-blue-400">{formatCurrency(summaryData.overview?.periodRevenue)}</div>
              <div className="mt-1 text-xs text-slate-400">Last {summaryPeriod} days volume</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                    <Calendar size={16} className="text-yellow-400" />
                    Daily Payment Activity ({summaryPeriod}d)
                  </h3>
                  {dailyPagination && dailyPagination.totalItems > 0 && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Page {dailyPagination.currentPage} of {dailyPagination.totalPages} &bull; {dailyPagination.totalItems} day{dailyPagination.totalItems !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {summaryData.dailyRevenue.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">No transactions recorded in this window.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/[0.06] text-[11px] text-slate-400">
                        <tr>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Bookings</th>
                          <th className="px-3 py-2.5">Gross Revenue</th>
                          <th className="px-3 py-2.5">Refunds</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {summaryData.dailyRevenue.map((d) => (
                          <tr key={d._id} className="hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5 font-mono text-slate-300">{d._id}</td>
                            <td className="px-3 py-2.5 font-semibold text-white">{d.count}</td>
                            <td className="px-3 py-2.5 font-semibold text-emerald-400">{formatCurrency(d.revenue)}</td>
                            <td className="px-3 py-2.5 text-rose-400">{d.refunds > 0 ? formatCurrency(d.refunds) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {dailyPagination && dailyPagination.totalPages > 1 && (
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <Pagination page={dailyPage} totalPages={dailyPagination.totalPages} onPageChange={onDailyPageChange} prevId="daily-rev-prev-btn" nextId="daily-rev-next-btn" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                    <Layers size={16} className="text-yellow-400" />
                    Top Revenue Generating Services
                  </h3>
                  {servicesPagination && servicesPagination.totalItems > 0 && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Page {servicesPagination.currentPage} of {servicesPagination.totalPages} &bull; {servicesPagination.totalItems} service{servicesPagination.totalItems !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {summaryData.topServices.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">No service revenue recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {summaryData.topServices.map((svc, idx) => {
                      const rank = idx + 1 + ((servicesPagination?.currentPage ?? 1) - 1) * (servicesPagination?.itemsPerPage ?? 10);
                      return (
                        <div key={svc._id} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition hover:border-white/[0.1] hover:bg-white/[0.035]">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-400/10 text-xs font-bold text-yellow-400">#{rank}</span>
                            <div>
                              <h4 className="max-w-[200px] truncate text-xs font-semibold text-white sm:max-w-[260px]">{svc.title}</h4>
                              <span className="text-[10px] capitalize text-slate-400">{svc.category} &bull; {svc.bookings} bookings</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-yellow-400">{formatCurrency(svc.revenue)}</div>
                            <span className="text-[10px] text-slate-500">Collected</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {servicesPagination && servicesPagination.totalPages > 1 && (
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <Pagination page={servicesPage} totalPages={servicesPagination.totalPages} onPageChange={onServicesPageChange} prevId="top-services-prev-btn" nextId="top-services-next-btn" />
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
