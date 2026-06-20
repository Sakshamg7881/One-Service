"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Clock, CheckCircle, AlertCircle,
  Bell, MessageSquare, Star, Plus, ArrowRight,
  Sparkles, MapPin, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "status-pending" },
  accepted:    { label: "Accepted",    cls: "status-accepted" },
  in_progress: { label: "In Progress", cls: "status-in_progress" },
  completed:   { label: "Completed",   cls: "status-completed" },
  cancelled:   { label: "Cancelled",   cls: "status-cancelled" },
  rejected:    { label: "Rejected",    cls: "status-rejected" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login");
    if (user?.role === "vendor") router.push("/vendor/dashboard");
    if (user?.role === "admin") router.push("/admin");
  }, [isAuthenticated, user]);

  const { data: bookingsData, isLoading } = useQuery(
    "my-bookings",
    () => api.get("/bookings?limit=5").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  const { data: notifData } = useQuery(
    "notifications",
    () => api.get("/notifications").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  const bookings = bookingsData?.data || [];
  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unread || 0;

  const stats = [
    { label: "Total Bookings",   value: bookingsData?.pagination?.total || 0, icon: Calendar, color: "text-blue-600 bg-blue-50" },
    { label: "Active",           value: bookings.filter((b: any) => ["pending","accepted","in_progress"].includes(b.status)).length, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
    { label: "Completed",        value: bookings.filter((b: any) => b.status === "completed").length, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Notifications",    value: unreadCount, icon: Bell, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* ── Top bar ────────────────────────────────────── */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <span className="font-bold text-slate-800">OneService</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications" className="relative btn-ghost p-2">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
          <button onClick={() => logout()} className="btn-ghost text-sm">Logout</button>
          <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center font-bold text-primary-700 text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening with your bookings</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bookings */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 text-lg">Recent Bookings</h2>
              <Link href="/dashboard/bookings" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin text-primary-400" size={32} />
              </div>
            ) : bookings.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No bookings yet</p>
                <Link href="/services" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <Plus size={16} /> Book a Service
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <Link key={b._id} href={`/dashboard/bookings/${b._id}`}>
                    <div className="glass-card p-4 hover:shadow-card-hover transition-shadow cursor-pointer flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Calendar size={20} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{b.service?.title || "Service"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {b.vendor?.businessName || "Vendor"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {b.scheduledAt ? format(new Date(b.scheduledAt), "MMM d, yyyy · hh:mm a") : "—"}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <span className={STATUS_CONFIG[b.status]?.cls || "badge-gray"}>
                          {STATUS_CONFIG[b.status]?.label || b.status}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">₹{b.amount?.total}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions + Notifications */}
          <div className="space-y-5">
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                {[
                  { href: "/services",          icon: Plus,          label: "Book New Service", primary: true },
                  { href: "/dashboard/ai",      icon: Sparkles,      label: "AI Problem Analyzer" },
                  { href: "/dashboard/chat",    icon: MessageSquare, label: "My Chats" },
                  { href: "/dashboard/reviews", icon: Star,          label: "Write a Review" },
                ].map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${a.primary ? "bg-primary-500 text-white hover:bg-primary-600" : "hover:bg-primary-50 text-slate-700"}`}>
                      <a.icon size={17} className={a.primary ? "text-white" : "text-primary-500"} />
                      <span className="text-sm font-medium">{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && <span className="badge-blue">{unreadCount} new</span>}
              </div>
              {notifications.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 4).map((n: any) => (
                    <div key={n._id} className={`p-3 rounded-xl text-sm ${!n.isRead ? "bg-primary-50 border border-primary-100" : "bg-slate-50"}`}>
                      <p className="font-medium text-slate-800">{n.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
