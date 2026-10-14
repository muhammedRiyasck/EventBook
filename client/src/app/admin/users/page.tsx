"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 15;

export default function AdminUsersPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "user" | "admin">("");

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && !isAdmin) router.push("/dashboard");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleFilter = (r: "" | "user" | "admin") => {
    setRoleFilter(r);
    setPage(1);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (isLoading || !isAdmin)
    return (
      <div
        className="page-wrapper"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="spinner" />
      </div>
    );

  return (
    <div className="min-h-screen overflow-hidden bg-[#050d1e] px-4 pb-20 pt-[100px] text-white sm:px-6">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-yellow-400/[0.05] blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
              Administration
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              User Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {pagination ? (
                <>
                  <span className="font-semibold text-slate-300">{pagination.total}</span> registered users
                </>
              ) : (
                "View and manage all registered users"
              )}
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-400">
            <Users size={26} />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="user-search-input"
              type="text"
              placeholder="Search by name or email&hellip;"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-yellow-400/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-yellow-400/20"
            />
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="shrink-0 text-slate-500" />
            {(["", "user", "admin"] as const).map((r) => (
              <button
                key={r}
                id={`role-filter-${r || "all"}`}
                onClick={() => handleRoleFilter(r)}
                className={`h-9 rounded-lg cursor-pointer px-3 text-xs font-semibold transition-all duration-200 ${
                  roleFilter === r
                    ? "bg-yellow-400 text-[#050d1e]"
                    : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {r === "" ? "All" : r === "admin" ? "Admins" : "Users"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1.4fr_auto_auto_auto] gap-4 border-b border-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <span>Name</span>
            <span>Email</span>
            <span className="hidden sm:block">Phone</span>
            <span>Role</span>
            <span className="hidden md:block">Joined</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <Users size={36} className="opacity-30" />
              <p className="text-sm">No users found</p>
              {(search || roleFilter) && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setRoleFilter("");
                  }}
                  className="mt-1 cursor-pointer text-xs text-yellow-400 underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            users.map((u, idx) => (
              <div
                key={u._id}
                className={`grid grid-cols-[1fr_1.4fr_auto_auto_auto] items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.04] ${
                  idx !== users.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                {/* Name + avatar */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-sm font-bold text-indigo-300">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate text-sm font-semibold text-white">
                    {u.name}
                  </span>
                </div>

                {/* Email */}
                <div className="flex min-w-0 items-center gap-1.5 text-slate-400">
                  <Mail size={12} className="shrink-0 opacity-60" />
                  <span className="truncate text-sm">{u.email}</span>
                </div>

                {/* Phone */}
                <div className="hidden items-center gap-1.5 text-slate-500 sm:flex">
                  <Phone size={12} className="shrink-0 opacity-60" />
                  <span className="text-sm">{u.phone || "—"}</span>
                </div>

                {/* Role badge */}
                <div>
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
                      <Shield size={10} />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                      <User size={10} />
                      User
                    </span>
                  )}
                </div>

                {/* Joined */}
                <div className="hidden items-center gap-1.5 text-slate-500 md:flex">
                  <Calendar size={12} className="shrink-0 opacity-60" />
                  <span className="whitespace-nowrap text-xs">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-300">
                {(pagination.page - 1) * pagination.limit + 1}
                {"–"}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-300">
                {pagination.total}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                id="users-prev-page"
                onClick={() => setPage((p) => p - 1)}
                disabled={pagination.page <= 1}
                className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-all duration-200 hover:border-yellow-400/30 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - pagination.page) <= 1
                )
                .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                  if (
                    i > 0 &&
                    typeof arr[i - 1] === "number" &&
                    (p as number) - (arr[i - 1] as number) > 1
                  )
                    acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "ellipsis" ? (
                    <span key={`dots-${i}`} className="px-1 text-xs text-slate-600">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={p}
                      id={`users-page-${p}`}
                      onClick={() => setPage(p as number)}
                      className={`h-9 w-9 cursor-pointer rounded-lg text-xs font-bold transition-all duration-200 ${
                        pagination.page === p
                          ? "bg-yellow-400 text-[#050d1e]"
                          : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-yellow-400/30 hover:text-yellow-400"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                id="users-next-page"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-all duration-200 hover:border-yellow-400/30 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
