/**
 * Common formatting utilities for dates and currency
 */

export const formatDate = (d?: string | Date | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (d?: string | Date | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (amt: number = 0): string => {
  return "₹" + amt.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const formatINR = (amt: number = 0): string => {
  return new Intl.NumberFormat("en-IN").format(amt);
};
