import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import "./index.css";

export const metadata: Metadata = {
  title: "EventBook — Premium Event Booking Platform",
  description:
    "Book the best venues, hotels, caterers, DJs, decorators, and cameramen for your special events. Find and book premium event services with ease.",
  keywords:
    "event booking, venue, caterer, DJ, wedding, hotel, decorator, cameraman",
  authors: [{ name: "EventBook" }],
  openGraph: {
    title: "EventBook — Premium Event Booking Platform",
    description: "Book premium event services for your special occasions",
    type: "website",
  },
};

import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          <AdminNavbar />
          <main>{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0f1c3f",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#ffd700", secondary: "#0f1c3f" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0f1c3f" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
