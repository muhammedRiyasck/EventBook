import React from "react";
import { getBookingStatusBadgeClass, getBookingStatusDotClass } from "@/utils/bookingHelpers";
import { BookingStatus } from "@/types";

interface StatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${getBookingStatusBadgeClass(
        status
      )} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${getBookingStatusDotClass(status)}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
