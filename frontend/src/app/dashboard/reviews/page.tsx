"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Loader2, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function WriteReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { isAuthenticated } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data } = useQuery(
    ["booking-for-review", bookingId],
    () => api.get(`/bookings/${bookingId}`).then((r) => r.data),
    { enabled: !!bookingId && isAuthenticated }
  );

  const mutation = useMutation(
    () => api.post("/reviews", {
      bookingId,
      vendorId: data?.data?.vendor?._id,
      serviceId: data?.data?.service?._id,
      rating,
      comment,
    }),
    {
      onSuccess: () => setSubmitted(true),
      onError: (err: any) => toast.error(err.response?.data?.message || "Failed to submit review."),
    }
  );

  const booking = data?.data;
  const LABELS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 text-center max-w-sm">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Submitted!</h2>
          <p className="text-slate-500 mb-6">Thank you for your feedback. It helps other customers make better decisions.</p>
          <Link href="/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/bookings" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <span className="font-bold text-slate-800">Write a Review</span>
      </header>

      <div className="max-w-lg mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {booking && (
            <div className="glass-card p-5 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">🛠️</div>
              <div>
                <p className="font-semibold text-slate-800">{booking.service?.title}</p>
                <p className="text-slate-500 text-sm">{booking.vendor?.businessName}</p>
              </div>
            </div>
          )}

          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">How was your experience?</h2>

            {/* Star rating */}
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hovered || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-slate-200 fill-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {(hovered || rating) > 0 && (
              <p className="text-center text-sm font-medium text-slate-600 mb-6">
                {LABELS[hovered || rating]}
              </p>
            )}

            {/* Comment */}
            <div className="mb-6">
              <label className="input-label">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your experience. What went well? What could be improved?"
                rows={5}
                className="input-field resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/500</p>
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={rating === 0 || mutation.isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {mutation.isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {mutation.isLoading ? "Submitting..." : "Submit Review"}
            </button>

            {rating === 0 && (
              <p className="text-xs text-slate-400 text-center mt-3">Please select a star rating to continue</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
