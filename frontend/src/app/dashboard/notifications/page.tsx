"use client";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICONS: Record<string, string> = {
  booking_confirmed: "📅", booking_accepted: "✅", booking_rejected: "❌",
  booking_completed: "🎉", booking_cancelled: "🚫", payment_success: "💳",
  payment_failed: "⚠️", vendor_approved: "🎊", vendor_rejected: "❌",
  new_review: "⭐", chat_message: "💬", general: "🔔",
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    "notifications-page",
    () => api.get("/notifications").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  const readAllMutation = useMutation(
    () => api.patch("/notifications/read-all"),
    {
      onSuccess: () => { queryClient.invalidateQueries("notifications-page"); queryClient.invalidateQueries("notifications"); toast.success("All marked as read."); },
    }
  );

  const readOneMutation = useMutation(
    (id: string) => api.patch(`/notifications/${id}/read`),
    { onSuccess: () => { queryClient.invalidateQueries("notifications-page"); queryClient.invalidateQueries("notifications"); } }
  );

  const notifications = data?.data || [];
  const unread = data?.unread || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
          <Bell size={18} className="text-primary-500" />
          <span className="font-bold text-slate-800">Notifications</span>
          {unread > 0 && <span className="badge-blue">{unread} new</span>}
        </div>
        {unread > 0 && (
          <button onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isLoading}
            className="btn-ghost text-sm flex items-center gap-1.5">
            {readAllMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Mark all read
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary-400" size={36} /></div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BellOff size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any, i: number) => (
              <motion.div key={n._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div
                  onClick={() => !n.isRead && readOneMutation.mutate(n._id)}
                  className={`glass-card p-4 cursor-pointer hover:shadow-card-hover transition-all flex items-start gap-4 ${!n.isRead ? "border-l-4 border-primary-400" : ""}`}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.isRead ? "text-slate-800" : "text-slate-600"}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-slate-400 text-xs mt-1.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
