"use client";
import { useState } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Loader2, MapPin, Clock, Download } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

const STATUSES = ["all","pending","accepted","in_progress","completed","cancelled","rejected"];
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "status-pending" },
  accepted:    { label: "Accepted",    cls: "status-accepted" },
  in_progress: { label: "In Progress", cls: "status-in_progress" },
  completed:   { label: "Completed",   cls: "status-completed" },
  cancelled:   { label: "Cancelled",   cls: "status-cancelled" },
  rejected:    { label: "Rejected",    cls: "status-rejected" },
};

export default function BookingsListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ["bookings", status, page],
    () => api.get(`/bookings?${status !== "all" ? `status=${status}&` : ""}page=${page}&limit=10`).then((r) => r.data),
    { enabled: isAuthenticated, keepPreviousData: true }
  );

  const bookings = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <span className="font-bold text-slate-800">My Bookings</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                status === s ? "bg-primary-500 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:border-primary-300"
              }`}>
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary-400" size={36} /></div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No bookings found</p>
            <Link href="/services" className="btn-primary mt-4 inline-block text-sm">Browse Services</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any, i: number) => (
              <motion.div key={b._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/dashboard/bookings/${b._id}`}>
                  <div className="glass-card p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">
                          {b.service?.category === "Plumbing" ? "🔧" : b.service?.category === "Electrical" ? "⚡" : b.service?.category === "Cleaning" ? "✨" : "🛠️"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{b.service?.title}</p>
                          <span className={STATUS_CONFIG[b.status]?.cls || "badge-gray"}>{STATUS_CONFIG[b.status]?.label || b.status}</span>
                          {b.isUrgent && <span className="badge bg-orange-100 text-orange-600">⚡ Urgent</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin size={11} />{b.vendor?.businessName}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} />{format(new Date(b.scheduledAt), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{format(new Date(b.scheduledAt), "hh:mm a")}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{b.bookingId}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-800">₹{b.amount?.total}</p>
                        {b.status === "completed" && (
                          <span className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-1">
                            <Download size={11} /> Receipt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 text-sm">← Prev</button>
            <span className="btn-ghost py-2 px-4 text-sm">{page} / {pagination.pages}</span>
            <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 text-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
