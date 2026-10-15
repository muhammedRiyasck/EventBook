"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { GuestRoute } from "@/components/auth/AuthGuards";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Invalid email address";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      toast.success("Welcome back!");

      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl && returnUrl.startsWith("/")) {
        if (returnUrl.startsWith("/admin") && loggedUser.role !== "admin") {
          router.push("/dashboard");
        } else {
          router.push(returnUrl);
        }
      } else if (loggedUser.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen [scrollbar-gutter:stable] bg-[#050d1e] px-4 py-10 text-white">
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
                <LogIn size={22} strokeWidth={2} />
              </div>

              <h1 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Sign in to continue to your EventBook dashboard
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSignIn}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
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
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                      errors.email
                        ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                        : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    className={`h-12 w-full rounded-xl border bg-black/20 pl-[46px] pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:bg-black/30 focus:ring-4 ${
                      errors.password
                        ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                        : "border-white/10 focus:border-yellow-400/50 focus:ring-yellow-400/[0.06]"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff size={17} className="cursor-pointer" />
                    ) : (
                      <Eye size={17} className="cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="-mt-1 flex justify-end">
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors hover:text-yellow-400"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-sm font-semibold text-[#0f1c3f] shadow-[0_0_20px_rgba(255,215,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0f1c3f]/20 border-t-[#0f1c3f]" />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          {/* Bottom text */}
          <p className="mt-5 text-center text-xs text-slate-600">
            Secure authentication powered by EventBook
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestRoute>
      <Suspense fallback={<div className="min-h-screen bg-[#050d1e]" />}>
        <LoginForm />
      </Suspense>
    </GuestRoute>
  );
}
