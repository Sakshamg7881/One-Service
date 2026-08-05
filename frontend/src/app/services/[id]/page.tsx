"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star, Clock, MapPin, CheckCircle, Calendar,
  Zap, ChevronLeft, Loader2, Shield, MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { format, addDays } from "date-fns";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data, isLoading } = useQuery(
    ["service", id],
    () => api.get(`/services/${id}`).then((r) => r.data)
  );

  const { data: reviewsData } = useQuery(
    ["reviews", data?.data?.vendor?._id],
    () => api.get(`/reviews/vendor/${data?.data?.vendor?._id}`).then((r) => r.data),
    { enabled: !!data?.data?.vendor?._id }
  );

const bookingMutation = useMutation(
  (payload: any) => api.post("/bookings", payload),
  {
    onSuccess: (res) => {
      toast.success("Booking created! Proceed to payment.");
      router.push(`/dashboard/bookings/${res.data.data._id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Booking failed.");
    },
  }
);

  const service = data?.data;
  const reviews = reviewsData?.data || [];

  const TIME_SLOTS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  const handleBook = () => {
    if (!isAuthenticated) { toast.error("Please login to book."); router.push("/auth/login"); return; }
    if (!selectedDate || !selectedTime) { toast.error("Please select date and time."); return; }
    if (!address.trim()) { toast.error("Please enter service address."); return; }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
    bookingMutation.mutate({
      serviceId: service._id,
      scheduledAt,
      isUrgent,
      address: { full: address },
      notes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <Loader2 className="animate-spin text-primary-400" size={40} />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-slate-600">Service not found.</p>
          <Link href="/services" className="btn-primary mt-4 inline-block">Back to Services</Link>
        </div>
      </div>
    );
  }

  const urgentFee = Math.round(service.price.base * 0.2);
  const platformFee = Math.round((service.price.base + (isUrgent ? urgentFee : 0)) * 0.1);
  const total = service.price.base + (isUrgent ? urgentFee : 0) + platformFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/services" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">OS</span>
        </div>
        <span className="font-bold text-slate-800">Service Details</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Service Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden h-72 bg-gradient-to-br from-primary-100 to-blue-200">
              {service.images?.[0] ? (
                <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  {service.category === "Plumbing" ? "🔧" : service.category === "Electrical" ? "⚡" : service.category === "Cleaning" ? "✨" : "🛠️"}
                </div>
              )}
            </motion.div>

            {/* Service info */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="badge-blue mb-2">{service.category}</span>
                  <h1 className="text-2xl font-bold text-slate-800 mt-1">{service.title}</h1>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">₹{service.price.base}</p>
                  <p className="text-slate-400 text-sm">{service.price.unit === "per_hour" ? "per hour" : "fixed price"}</p>
                </div>
              </div>

              <div className="flex items-center gap-5 mt-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" />
                  <strong className="text-slate-700">{service.rating?.toFixed(1) || "New"}</strong>
                  ({service.totalReviews} reviews)
                </span>
                <span className="flex items-center gap-1.5"><Clock size={15} /> {service.duration} min</span>
                <span className="flex items-center gap-1.5"><Shield size={15} className="text-green-500" /> Insured</span>
              </div>

              <p className="text-slate-600 mt-4 leading-relaxed">{service.description}</p>

              {service.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {service.tags.map((tag: string) => (
                    <span key={tag} className="badge-gray">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Vendor info */}
            <div className="glass-card p-6">
              <h2 className="font-bold text-slate-800 mb-4">About the Vendor</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                  {service.vendor?.businessName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{service.vendor?.businessName}</p>
                    {service.vendor?.isVerified && <span className="badge-blue text-xs">✓ Verified</span>}
                  </div>
                  <p className="text-xs text-slate-500">ID: {service.vendor?.vendorId}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Star size={13} className="text-yellow-400 fill-yellow-400" /> {service.vendor?.rating?.toFixed(1)}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> {service.vendor?.location?.city || "Available nearby"}</span>
                  </div>
                </div>
                <Link href={`/vendors/${service.vendor?._id}`} className="btn-secondary text-sm py-2">View Profile</Link>
              </div>
            </div>

            {/* Reviews */}
            <div className="glass-card p-6">
              <h2 className="font-bold text-slate-800 mb-4">Customer Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((r: any) => (
                    <div key={r._id} className="border-b border-slate-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-xs">
                          {r.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{r.user?.name}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 ml-auto">{format(new Date(r.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Panel */}
          <div className="space-y-4">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="font-bold text-slate-800 mb-5 text-lg">Book This Service</h2>

              {!showBookingForm ? (
                <div className="space-y-4">
                  {/* Price summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Base price</span>
                      <span className="font-medium">₹{service.price.base}</span>
                    </div>
                    {isUrgent && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Urgent fee (20%)</span>
                        <span className="font-medium text-orange-500">+₹{urgentFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Platform fee (10%)</span>
                      <span className="font-medium">₹{platformFee}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary-600 text-lg">₹{total}</span>
                    </div>
                  </div>

                  {/* Urgent toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-primary-300 transition-colors">
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${isUrgent ? "bg-orange-500" : "bg-slate-200"}`}
                      onClick={() => setIsUrgent(!isUrgent)}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${isUrgent ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Zap size={14} className="text-orange-500" /> Urgent Mode</p>
                      <p className="text-xs text-slate-400">Priority booking, arrives sooner (+20%)</p>
                    </div>
                  </label>

                  <button onClick={() => setShowBookingForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Calendar size={17} /> Book Now
                  </button>
                  <button className="btn-secondary w-full flex items-center justify-center gap-2">
                    <MessageSquare size={17} /> Chat with Vendor
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Date selection */}
                  <div>
                    <label className="input-label">Select Date</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {dates.map((d) => {
                        const val = format(d, "yyyy-MM-dd");
                        return (
                          <button key={val} onClick={() => setSelectedDate(val)}
                            className={`p-2 rounded-lg text-center text-xs transition-colors ${selectedDate === val ? "bg-primary-500 text-white" : "bg-slate-100 hover:bg-primary-50 text-slate-700"}`}>
                            <p className="font-medium">{format(d, "dd")}</p>
                            <p className="text-xs opacity-70">{format(d, "EEE")}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time selection */}
                  <div>
                    <label className="input-label">Select Time</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TIME_SLOTS.map((t) => (
                        <button key={t} onClick={() => setSelectedTime(t)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${selectedTime === t ? "bg-primary-500 text-white" : "bg-slate-100 hover:bg-primary-50 text-slate-700"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="input-label">Service Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your full address..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="input-label">Additional Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific instructions..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Price summary */}
                  <div className="bg-primary-50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between font-bold">
                      <span>Total to pay</span>
                      <span className="text-primary-600 text-base">₹{total}</span>
                    </div>
                  </div>

                  <button onClick={handleBook} disabled={bookingMutation.isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {bookingMutation.isLoading ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} />}
                    {bookingMutation.isLoading ? "Creating Booking..." : "Confirm Booking"}
                  </button>
                  <button onClick={() => setShowBookingForm(false)} className="btn-ghost w-full text-sm">← Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
