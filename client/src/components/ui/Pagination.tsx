import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  prevId?: string;
  nextId?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  prevId = "pagination-prev-page",
  nextId = "pagination-next-page",
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        id={prevId}
        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        ← Previous
      </button>

      <div className="flex h-10 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm text-slate-400">
        Page <span className="mx-1 font-semibold text-white">{page}</span> of{" "}
        <span className="ml-1 font-semibold text-white">{totalPages}</span>
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        id={nextId}
        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-slate-300 transition hover:border-yellow-400/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
};

export default Pagination;
