"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name":
        return value.trim().length < 3 ? "Name must be at least 3 characters" : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email address" : "";
      case "password":
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!value) return "Password is required";
        if (!passwordRegex.test(value)) {
          return "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character.";
        }
        return "";
      case "phone":
        return value && !/^[0-9]{10}$/.test(value) ? "Phone number must be exactly 10 digits" : "";
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      password: validateField("password", form.password),
      phone: validateField("phone", form.phone),
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(err => err !== "")) {
      return;
    }
    
    setLoading(true);
    try {
      await register(
        form.name,
        form.email,
        form.password,
        form.phone || undefined,
      );
      toast.success("Account created! Welcome to EventBook 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
  <div className="min-h-screen pt-20 bg-[#050d1e] px-4 py-10 text-white">
    {/* Background */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-yellow-400/10 blur-[100px]" />
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/10 blur-[100px]" />
    </div>

    {/* Container */}
    <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center">
      <div className="w-full max-w-[520px]">
        {/* Card */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0a1628]/75 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.08] text-yellow-400 shadow-[0_8px_30px_rgba(255,215,0,0.08)]">
              <CalendarDays size={22} />
            </div>

            <h1 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Join EventBook and start planning
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-300"
              >
                Full Name
              </label>

              <div className="group relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-yellow-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                    errors.name
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                      : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                  }`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="reg-email"
                className="text-sm font-medium text-slate-300"
              >
                Email Address
              </label>

              <div className="group relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-yellow-400"
                />

                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                      : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-slate-300"
              >
                Phone
                <span className="ml-1 text-xs font-normal text-slate-600">
                  (optional)
                </span>
              </label>

              <div className="group relative">
                <Phone
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-yellow-400"
                />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                    errors.phone
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                      : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                  }`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="reg-password"
                className="text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="group relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-yellow-400"
                />

                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                      : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              {errors.password ? (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              ) : (
                <p className="text-xs text-slate-600 mt-1">
                  At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-sm font-semibold text-[#0f1c3f] shadow-[0_0_20px_rgba(255,215,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f1c3f]/20 border-t-[#0f1c3f]" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Create your EventBook account securely
        </p>
      </div>
    </div>
  </div>
);
}
