import React from "react";
import Link from "next/link";
import { ShieldCheck, Pencil, Layers, CalendarDays } from "lucide-react";
import { Service } from "@/types";

interface AdminServicePanelProps {
  service: Service;
  bookingMode: string;
}

export const AdminServicePanel: React.FC<AdminServicePanelProps> = ({
  service,
  bookingMode,
}) => {
  return (
    <div className="space-y-5 p-6 sm:p-7">
      <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/[0.08] p-4 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400">
          <ShieldCheck size={22} />
        </div>
        <h3 className="text-sm font-bold text-white">Administrator View</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          You are viewing this service as an administrator. Slot and service
          bookings are reserved for customers.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Status</span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
              service.isActive
                ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                : "border border-red-400/20 bg-red-400/10 text-red-400"
            }`}
          >
            {service.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Booking Mode</span>
          <span className="font-medium capitalize text-slate-200">
            {bookingMode.replace("_", " ")}
          </span>
        </div>
        {bookingMode === "time_slot" && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Configured Slots</span>
            <span className="font-medium text-slate-200">
              {service.timeSlots?.length || 0} slot
              {service.timeSlots?.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        {service.capacity && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Max Capacity</span>
            <span className="font-medium text-slate-200">
              {service.capacity} guests
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2.5 pt-1">
        <Link
          href={`/admin/services/${service._id}/edit`}
          id="admin-edit-service-btn"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(250,204,21,0.15)] transition-all duration-200 hover:bg-yellow-300 hover:shadow-[0_12px_35px_rgba(250,204,21,0.25)]"
        >
          <Pencil size={16} />
          Edit This Service
        </Link>

        <Link
          href="/admin/services"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <Layers size={16} />
          All Services in Dashboard
        </Link>

        <Link
          href="/admin/bookings"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <CalendarDays size={16} />
          View Customer Bookings
        </Link>
      </div>
    </div>
  );
};
