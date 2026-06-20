"use client";
import { useQuery } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, IndianRupee, TrendingUp, Clock,
  CheckCircle, Download, Loader2, ArrowUpRight, Calendar
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function VendorEarningsPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: vendorData } = useQuery("vendor-me", () => api.get("/vendors/me").then((r) => r.data), { enabled: isAuthenticated });
  const { data: paymentsData, isLoading } = useQuery(
    "vendor-payments",
    () => api.get("/payments/history?limit=20").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  const vendor = vendorData?.data;
  const payments = paymentsData?.data || [];

  // Build monthly chart data from payments
  const monthlyMap: Record<string, number> = {};
  payments.forEach((p: any) => {
    if (p.status === "succeeded") {
      const key = format(new Date(p.createdAt), "MMM yy");
      monthlyMap[key] = (monthlyMap[key] || 0) + (p.vendorAmount || 0);
    }
  });
  const chartData = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount })).slice(-6);

  const STAT_CARDS = [
    { label: "Total Earned",   value: `₹${(vendor?.earnings?.total || 0).toLocaleString()}`,     icon: IndianRupee, color: "text-green-600 bg-green-50",  desc: "Lifetime earnings" },
    { label: "Pending Payout", value: `₹${(vendor?.earnings?.pending || 0).toLocaleString()}`,   icon: Clock,       color: "text-yellow-600 bg-yellow-50", desc: "Awaiting transfer" },
    { label: "Withdrawn",      value: `₹${(vendor?.earnings?.withdrawn || 0).toLocaleString()}`, icon: CheckCircle, color: "text-blue-600 bg-blue-50",    desc: "Successfully paid out" },
    { label: "Completed Jobs", value: vendor?.completedBookings || 0,                             icon: TrendingUp,  color: "text-purple-600 bg-purple-50", desc: "Total jobs done" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/vendor/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <IndianRupee size={18} className="text-primary-500" />
        <span className="font-bold text-slate-800">Earnings & Payouts</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
              <p className="text-xs text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Payout info banner */}
        <div className="glass-card p-5 flex items-start gap-4 border border-blue-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">How Payouts Work</p>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
              Earnings are transferred to your registered bank account every Monday for the previous week's completed bookings.
              Platform fee (10%) is deducted automatically. Contact support to set up your bank account for payouts.
            </p>
          </div>
          <a href="mailto:support@oneservice.com" className="btn-secondary text-sm py-2 flex-shrink-0">Contact Support</a>
        </div>

        {/* Monthly chart */}
        {chartData.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="font-bold text-slate-800 mb-5">Monthly Earnings</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#f8fafc", fontSize: 13 }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, "Earnings"]}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment history table */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Transaction History</h2>
            <span className="text-slate-400 text-sm">{payments.length} transactions</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary-400" size={28} /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <IndianRupee size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span className="col-span-2">Booking</span>
                <span className="text-center">Date</span>
                <span className="text-center">Status</span>
                <span className="text-right">Amount</span>
              </div>

              {payments.map((p: any, i: number) => (
                <motion.div key={p._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-5 gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-50 transition-colors items-center">
                  <div className="col-span-2">
                    <p className="font-medium text-slate-800 text-sm">{p.booking?.bookingId || "—"}</p>
                    <p className="text-slate-400 text-xs">{p.vendor?.businessName || ""}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 text-sm">{p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : "—"}</p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`badge text-xs ${
                      p.status === "succeeded" ? "badge-green" :
                      p.status === "refunded" ? "badge-yellow" :
                      p.status === "failed" ? "badge-red" : "badge-gray"
                    }`}>{p.status}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${p.status === "succeeded" ? "text-green-600" : "text-slate-500"}`}>
                      {p.status === "succeeded" ? "+" : ""}₹{(p.vendorAmount || p.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">After fee</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
