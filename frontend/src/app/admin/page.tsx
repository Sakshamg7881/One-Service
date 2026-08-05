"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, Calendar, IndianRupee,
  Clock, CheckCircle, XCircle, Loader2, BarChart3, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Tab = "overview" | "vendors" | "bookings" | "users";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
    if (user && user.role !== "admin") router.push("/dashboard");
  }, [isAuthenticated, user]);

  const { data: statsData } = useQuery("admin-stats", () => api.get("/admin/stats").then((r) => r.data), { enabled: isAuthenticated && user?.role === "admin" });
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery(
    ["admin-vendors", tab],
    () => api.get(`/admin/vendors?status=${tab === "vendors" ? "pending" : ""}&limit=20`).then((r) => r.data),
    { enabled: tab === "vendors" }
  );
  const { data: bookingsData } = useQuery(
    "admin-bookings",
    () => api.get("/admin/bookings?limit=20").then((r) => r.data),
    { enabled: tab === "bookings" }
  );
  const { data: usersData } = useQuery(
    "admin-users",
    () => api.get("/admin/users?limit=20").then((r) => r.data),
    { enabled: tab === "users" }
  );

const vendorMutation = useMutation(
  ({ vendorId, action, note }: { vendorId: string; action: string; note?: string }) =>
    api.patch(`/admin/vendors/${vendorId}/approve`, { action, note }),
  {
    onSuccess: (
      _: any,
      vars: {
        vendorId: string;
        action: string;
        note?: string;
      }
    ) => {
      queryClient.invalidateQueries("admin-vendors");
      queryClient.invalidateQueries("admin-stats");
      toast.success(`Vendor ${vars.action}d successfully.`);
    },
    onError: () => {
      toast.error("Action failed.");
    },
  }
);

  const stats = statsData?.data;

  const STAT_CARDS = [
    { label: "Total Users",     value: stats?.totalUsers || 0,      icon: Users,       color: "text-blue-600 bg-blue-50" },
    { label: "Total Vendors",   value: stats?.totalVendors || 0,    icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
    { label: "Total Bookings",  value: stats?.totalBookings || 0,   icon: Calendar,    color: "text-green-600 bg-green-50" },
    { label: "Pending Vendors", value: stats?.pendingVendors || 0,  icon: Clock,       color: "text-orange-600 bg-orange-50" },
    { label: "Active Bookings", value: stats?.activeBookings || 0,  icon: BarChart3,   color: "text-cyan-600 bg-cyan-50" },
    { label: "Revenue (₹)",     value: (stats?.revenue?.platformFee || 0).toLocaleString(), icon: IndianRupee, color: "text-emerald-600 bg-emerald-50" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "vendors",  label: "Vendor Approvals" },
    { key: "bookings", label: "Bookings" },
    { key: "users",    label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <span className="font-bold text-white">Admin Panel</span>
          <span className="badge bg-red-500/20 text-red-400 text-xs border border-red-500/30">ADMIN</span>
        </div>
        <button onClick={() => logout()} className="text-slate-400 hover:text-white text-sm transition-colors">Logout</button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 w-fit mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-primary-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              {t.label}
              {t.key === "vendors" && stats?.pendingVendors > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{stats.pendingVendors}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {STAT_CARDS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                    <s.icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <h3 className="text-slate-200 font-semibold mb-4">Monthly Booking Trend</h3>
              {stats?.monthlyTrend?.length > 0 ? (
                <div className="flex items-end gap-3 h-32">
                  {stats.monthlyTrend.map((m: any) => {
                    const max = Math.max(...stats.monthlyTrend.map((x: any) => x.count));
                    const pct = max > 0 ? (m.count / max) * 100 : 0;
                    const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    return (
                      <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400">{m.count}</span>
                        <div className="w-full bg-primary-500/80 rounded-t-md" style={{ height: `${pct}%`, minHeight: 4 }} />
                        <span className="text-xs text-slate-500">{months[m._id.month]}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No data yet</p>
              )}
            </div>
          </div>
        )}

        {/* Vendor Approvals */}
        {tab === "vendors" && (
          <div>
            <h2 className="text-lg font-bold mb-5 text-slate-200">Vendor Applications</h2>
            {vendorsLoading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-400" size={32} /></div>
            ) : (vendorsData?.data || []).length === 0 ? (
              <div className="bg-slate-800 rounded-2xl p-10 text-center border border-slate-700">
                <ShieldCheck size={40} className="text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(vendorsData?.data || []).map((v: any) => (
                  <div key={v._id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{v.businessName}</p>
                        <span className={`badge text-xs ${v.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : v.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5">{v.user?.name} · {v.user?.email}</p>
                      <p className="text-slate-500 text-xs mt-1">Categories: {v.categories?.join(", ")}</p>
                      <p className="text-slate-500 text-xs">ID: {v.vendorId}</p>
                      {v.govIdUrl && (
                        <a href={v.govIdUrl} target="_blank" rel="noreferrer" className="text-primary-400 text-xs hover:underline flex items-center gap-1 mt-1">
                          <Eye size={12} /> View Government ID
                        </a>
                      )}
                    </div>
                    {v.status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => vendorMutation.mutate({ vendorId: v._id, action: "approve" })}
                          disabled={vendorMutation.isLoading}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle size={15} /> Approve
                        </button>
                        <button
                          onClick={() => vendorMutation.mutate({ vendorId: v._id, action: "reject", note: "Does not meet our requirements." })}
                          disabled={vendorMutation.isLoading}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div>
            <h2 className="text-lg font-bold mb-5 text-slate-200">All Bookings</h2>
            <div className="space-y-3">
              {(bookingsData?.data || []).map((b: any) => (
                <div key={b._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{b.service?.title}</p>
                    <p className="text-slate-400 text-xs">{b.user?.name} → {b.vendor?.businessName}</p>
                    <p className="text-slate-500 text-xs">{b.bookingId}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-xs ${b.status === "completed" ? "bg-green-500/20 text-green-400" : b.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{b.status}</span>
                    <p className="text-slate-300 font-semibold text-sm mt-1">₹{b.amount?.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            <h2 className="text-lg font-bold mb-5 text-slate-200">All Users</h2>
            <div className="space-y-2">
              {(usersData?.data || []).map((u: any) => (
                <div key={u._id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${u.role === "admin" ? "bg-red-500/20 text-red-400" : u.role === "vendor" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>{u.role}</span>
                    <span className={`badge text-xs ${u.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>{u.isActive ? "Active" : "Suspended"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
