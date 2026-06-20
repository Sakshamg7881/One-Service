"use client";
import { useState } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, IndianRupee, Download, Loader2, CreditCard, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
  succeeded:           { label: "Paid",            icon: CheckCircle, cls: "badge-green" },
  failed:              { label: "Failed",           icon: XCircle,     cls: "badge-red" },
  refunded:            { label: "Refunded",         icon: RotateCcw,   cls: "badge-yellow" },
  partially_refunded:  { label: "Part. Refunded",   icon: RotateCcw,   cls: "badge-yellow" },
  created:             { label: "Pending",          icon: CreditCard,  cls: "badge-gray" },
};

export default function PaymentHistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ["payment-history", page],
    () => api.get(`/payments/history?page=${page}&limit=10`).then((r) => r.data),
    { enabled: isAuthenticated, keepPreviousData: true }
  );

  const payments = data?.data || [];
  const pagination = data?.pagination;

  const totalPaid = payments.filter((p: any) => p.status === "succeeded").reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalRefunded = payments.filter((p: any) => p.status === "refunded").reduce((sum: number, p: any) => sum + p.refund?.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <CreditCard size={18} className="text-primary-500" />
        <span className="font-bold text-slate-800">Payment History</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Spent",    value: `₹${totalPaid.toLocaleString()}`,    color: "text-blue-600 bg-blue-50",   icon: IndianRupee },
            { label: "Total Refunded", value: `₹${totalRefunded.toLocaleString()}`,color: "text-yellow-600 bg-yellow-50",icon: RotateCcw },
            { label: "Transactions",   value: pagination?.total || payments.length, color: "text-green-600 bg-green-50", icon: CreditCard },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Payments list */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-slate-800 mb-5">All Transactions</h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary-400" size={28} /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No payments yet</p>
              <Link href="/services" className="btn-primary mt-4 inline-block text-sm">Book a Service</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any, i: number) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created;
                return (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      p.status === "succeeded" ? "bg-green-50" : p.status === "failed" ? "bg-red-50" : "bg-yellow-50"
                    }`}>
                      <cfg.icon size={18} className={p.status === "succeeded" ? "text-green-500" : p.status === "failed" ? "text-red-500" : "text-yellow-500"} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">
                        {p.booking?.bookingId || "Payment"}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {p.vendor?.businessName || "OneService"} · {p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy · hh:mm a") : "—"}
                      </p>
                      {p.stripePaymentIntentId && (
                        <p className="text-slate-300 text-xs font-mono mt-0.5 truncate">{p.stripePaymentIntentId.slice(-16)}</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-base ${p.status === "succeeded" ? "text-slate-800" : "text-slate-400"}`}>
                        {p.status === "refunded" ? "-" : ""}₹{p.amount?.toLocaleString()}
                      </p>
                      <span className={`${cfg.cls} text-xs mt-1`}>{cfg.label}</span>
                    </div>

                    {p.status === "succeeded" && p.booking?._id && (
                      <Link href={`/dashboard/bookings/${p.booking._id}`} className="btn-ghost p-2 flex-shrink-0">
                        <Download size={15} className="text-primary-500" />
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 text-sm">← Prev</button>
              <span className="btn-ghost py-2 px-4 text-sm">{page} / {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 text-sm">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
