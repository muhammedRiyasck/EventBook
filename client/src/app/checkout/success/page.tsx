"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <CheckCircle className="mb-6 h-20 w-20 text-green-500" />
      <h1 className="mb-4 text-4xl font-bold text-white">Payment Successful!</h1>
      <p className="mb-8 text-lg text-slate-400 max-w-md">
        Thank you for your booking. Your payment has been processed successfully and your booking is now confirmed. A confirmation email has been sent to you.
      </p>
      <Link
        href="/bookings"
        className="rounded-xl bg-yellow-500 px-8 py-3 font-semibold text-slate-900 transition-colors hover:bg-yellow-400"
      >
        View My Bookings
      </Link>
    </div>
  );
}
