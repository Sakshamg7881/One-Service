"use client";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Edit3, Trash2, Loader2, Star, Clock, Package, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function VendorServicesPage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: vendorData } = useQuery("vendor-me", () => api.get("/vendors/me").then((r) => r.data));
  const vendor = vendorData?.data;

  const { data, isLoading } = useQuery(
    ["vendor-services", vendor?._id],
    () => api.get(`/services?vendorId=${vendor?._id}&limit=50`).then((r) => r.data),
    { enabled: !!vendor?._id }
  );

const toggleMutation = useMutation(
  ({ id, isActive }: { id: string; isActive: boolean }) =>
    api.patch(`/services/${id}`, { isActive }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries("vendor-services");
      toast.success("Updated!");
    },
    onError: () => {
      toast.error("Failed to update.");
    },
  }
);

const deleteMutation = useMutation(
  (id: string) => api.delete(`/services/${id}`),
  {
    onSuccess: () => {
      queryClient.invalidateQueries("vendor-services");
      toast.success("Service deleted.");
    },
    onError: () => {
      toast.error("Delete failed.");
    },
  }
);

  const services = data?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/vendor/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
          <span className="font-bold text-slate-800">My Services</span>
        </div>
        <Link href="/vendor/services/new" className="btn-primary text-sm py-2 flex items-center gap-1.5">
          <Plus size={15} /> Add Service
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary-400" size={36} /></div>
        ) : services.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-1">No services yet</p>
            <p className="text-slate-400 text-sm mb-5">Create your first service to start receiving bookings</p>
            <Link href="/vendor/services/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Create First Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">{services.length} service{services.length !== 1 ? "s" : ""}</p>
            {services.map((s: any, i: number) => (
              <motion.div key={s._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-5">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary-100 flex-shrink-0 flex items-center justify-center">
                    {s.images?.[0]
                      ? <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{s.category === "Plumbing" ? "🔧" : s.category === "Electrical" ? "⚡" : "🛠️"}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm">{s.title}</h3>
                      <span className="badge-blue text-xs">{s.category}</span>
                      {!s.isActive && <span className="badge-red text-xs">Inactive</span>}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{s.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">₹{s.price?.base} <span className="font-normal text-slate-400">{s.price?.unit === "per_hour" ? "/hr" : ""}</span></span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {s.duration}min</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /> {s.rating?.toFixed(1) || "New"} ({s.totalReviews})</span>
                      <span>{s.totalBookings} bookings</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: s._id, isActive: !s.isActive })}
                      disabled={toggleMutation.isLoading}
                      className="btn-ghost p-2"
                      title={s.isActive ? "Deactivate" : "Activate"}
                    >
                      {s.isActive
                        ? <ToggleRight size={22} className="text-green-500" />
                        : <ToggleLeft size={22} className="text-slate-400" />}
                    </button>
                    <Link href={`/vendor/services/${s._id}/edit`} className="btn-ghost p-2">
                      <Edit3 size={16} className="text-slate-500" />
                    </Link>
                    <button
                      onClick={() => { if (confirm("Delete this service?")) deleteMutation.mutate(s._id); }}
                      disabled={deleteMutation.isLoading}
                      className="btn-ghost p-2"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
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
