import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/[0.1] bg-[#0a1628]/40 p-12 text-center backdrop-blur-xl ${className}`}
    >
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-400">
          {icon}
        </div>
      )}

      <h3 className={`${icon ? "mt-5" : ""} text-base font-semibold text-white`}>
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 cursor-pointer rounded-xl border border-yellow-400/20 bg-yellow-400/[0.06] px-4 py-2.5 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/10"
        >
          {actionLabel}
        </button>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
