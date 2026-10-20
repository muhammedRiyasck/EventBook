import React from "react";
import { Layers, CheckCircle2, IndianRupee, Tag } from "lucide-react";
import { formatINR } from "@/utils/formatters";

interface ServicesMetricsProps {
  metrics: {
    total: number;
    active: number;
    avgRate: number;
    uniqueCategories: number;
  };
}

export const ServicesMetrics: React.FC<ServicesMetricsProps> = ({ metrics }) => {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {/* Total Services */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Services
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
            <Layers size={16} />
          </div>
        </div>
        <div className="mt-3 text-2xl font-black text-white sm:text-3xl">
          {metrics.total}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-medium text-emerald-400">
            {metrics.active} active
          </span>
          <span>across platform</span>
        </div>
      </div>

      {/* Active Ratio */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Ratio
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-3 text-2xl font-black text-emerald-400 sm:text-3xl">
          {metrics.total > 0
            ? Math.round((metrics.active / metrics.total) * 100)
            : 0}
          %
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Live and bookable catalog
        </div>
      </div>

      {/* Avg Base Rate */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg. Base Rate
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400">
            <IndianRupee size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-center text-2xl font-black text-white sm:text-3xl">
          <span className="text-yellow-400">₹</span>
          {formatINR(metrics.avgRate)}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Average listed price
        </div>
      </div>

      {/* Categories */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Categories
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-400/10 text-purple-400">
            <Tag size={16} />
          </div>
        </div>
        <div className="mt-3 text-2xl font-black text-white sm:text-3xl">
          {metrics.uniqueCategories}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Distinct service verticals
        </div>
      </div>
    </div>
  );
};

export default ServicesMetrics;
