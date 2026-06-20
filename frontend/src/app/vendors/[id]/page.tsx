"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, Star, MapPin, Shield, Clock,
  Calendar, Loader2, MessageSquare, CheckCircle, Package
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";

export default function VendorPublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery(
    ["vendor-profile", id],
    () => api.get(`/vendors/${id}`).then((r) => r.data)
  );

  const { data: reviewsData } = useQuery(
    ["vendor-reviews", id],
    () => api.get(`/reviews/vendor/${id}?limit=10`).then((r) => r.data),
    { enabled: !!id }
  );

  const vendor = data?.data?.vendor;
  const services = data?.data?.services || [];
  const reviews = reviewsData?.data || [];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-400" size={40} /></div>;
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-slate-600">Vendor not found.</p>
          <Link href="/services" className="btn-primary mt-4 inline-block">Browse Services</Link>
        </div>
      </div>
    );
  }

  const DAY_LABELS: Record<string, string> = {
    Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2"><ChevronLeft size={20} /></button>
        <span className="font-bold text-slate-800">Vendor Profile</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Vendor Info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Hero card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-200 to-blue-300 flex items-center justify-center text-3xl font-bold text-primary-700 flex-shrink-0">
                  {vendor.businessName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-800">{vendor.businessName}</h1>
                    {vendor.isVerified && (
                      <span className="badge-blue flex items-center gap-1"><Shield size={11} /> Verified</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mt-1">Vendor ID: {vendor.vendorId}</p>

                  <div className="flex items-center gap-5 mt-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Star size={15} className="text-yellow-400 fill-yellow-400" />
                      <strong>{vendor.rating?.toFixed(1) || "New"}</strong>
                      <span className="text-slate-400">({vendor.totalReviews} reviews)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary-500" />
                      {vendor.totalBookings} bookings
                    </span>
                    {vendor.location?.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary-500" />
                        {vendor.location.city}
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  {vendor.categories?.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {vendor.categories.map((c: string) => (
                        <span key={c} className="badge-blue text-xs">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {vendor.description && (
                <p className="text-slate-600 text-sm mt-5 leading-relaxed border-t border-slate-100 pt-4">
                  {vendor.description}
                </p>
              )}
            </motion.div>

            {/* Services */}
            <div>
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Package size={18} className="text-primary-500" /> Services Offered ({services.length})
              </h2>
              {services.length === 0 ? (
                <div className="glass-card p-8 text-center text-slate-400">No services listed yet</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map((s: any, i: number) => (
                    <motion.div key={s._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Link href={`/services/${s._id}`}>
                        <div className="service-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
                              {s.category === "Plumbing" ? "🔧" : s.category === "Electrical" ? "⚡" : s.category === "Cleaning" ? "✨" : "🛠️"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm line-clamp-1">{s.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-0.5"><Star size={11} className="text-yellow-400 fill-yellow-400" /> {s.rating?.toFixed(1) || "New"}</span>
                                <span className="flex items-center gap-0.5"><Clock size={11} /> {s.duration}m</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-primary-600">₹{s.price?.base}</p>
                              <span className="badge-blue text-xs mt-0.5">Book</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Star size={18} className="text-yellow-400 fill-yellow-400" /> Customer Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <div className="glass-card p-8 text-center text-slate-400">No reviews yet</div>
              ) : (
                <div className="glass-card p-5 space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-xs">
                          {r.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{r.user?.name}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{format(new Date(r.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      {r.comment && <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>}
                      {r.vendorReply?.text && (
                        <div className="mt-2 ml-4 pl-3 border-l-2 border-primary-200 text-xs text-slate-500 italic">
                          <strong className="text-primary-600">Vendor replied:</strong> {r.vendorReply.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-4">At a Glance</h3>
              <div className="space-y-3">
                {[
                  { label: "Rating",      value: `${vendor.rating?.toFixed(1) || "New"} / 5`,    icon: Star },
                  { label: "Reviews",     value: vendor.totalReviews || 0,                        icon: MessageSquare },
                  { label: "Jobs Done",   value: vendor.completedBookings || 0,                   icon: CheckCircle },
                  { label: "Member Since",value: format(new Date(vendor.createdAt || Date.now()), "MMM yyyy"), icon: Calendar },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm">
                    <s.icon size={15} className="text-primary-500 flex-shrink-0" />
                    <span className="text-slate-500 flex-1">{s.label}</span>
                    <span className="font-semibold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            {vendor.availability?.slots?.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-primary-500" /> Working Hours
                </h3>
                <div className="space-y-2">
                  {vendor.availability.slots.map((s: any) => (
                    <div key={s.day} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 w-8">{s.day}</span>
                      <span className="text-slate-700 font-medium">{s.from} – {s.to}</span>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${vendor.availability?.isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vendor.availability?.isOnline ? "bg-green-500" : "bg-slate-400"}`} />
                  {vendor.availability?.isOnline ? "Currently Online" : "Currently Offline"}
                </div>
              </div>
            )}

            {/* CTA */}
            {services.length > 0 && (
              <Link href={`/services/${services[0]._id}`}>
                <div className="btn-primary w-full text-center py-3">Book Now</div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
