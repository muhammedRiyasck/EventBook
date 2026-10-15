"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/AuthGuards";

export default function CheckoutCancelPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <XCircle className="mb-6 h-20 w-20 text-red-500" />
        <h1 className="mb-4 text-4xl font-bold text-white">Payment Cancelled</h1>
        <p className="mb-8 text-lg text-slate-400 max-w-md">
          Your payment was cancelled and your booking has not been confirmed. You can try booking again when you are ready.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="rounded-xl bg-white/[0.05] border border-white/[0.1] px-8 py-3 font-semibold text-white transition-colors hover:bg-white/[0.1]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
