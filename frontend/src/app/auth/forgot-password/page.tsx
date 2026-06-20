"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setUserId(res.data.userId);
      setStep("otp");
      toast.success("OTP sent to your email!");
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return;
    setStep("reset");
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { userId, otp, newPassword });
      toast.success("Password reset! Please login.");
      router.push("/auth/login");
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-sm p-8">
        <Link href="/auth/login" className="btn-ghost p-2 mb-4 inline-flex items-center gap-1 text-sm">
          <ChevronLeft size={16} /> Back to Login
        </Link>

        {step === "email" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold text-slate-800">Forgot password?</h2>
              <p className="text-slate-500 text-sm mt-1">Enter your email and we'll send you a reset OTP</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendOTP()} placeholder="you@example.com" className="input-field pl-10" />
                </div>
              </div>
              <button onClick={sendOTP} disabled={!email || loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Sending..." : "Send Reset OTP"}
              </button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h2 className="text-xl font-bold text-slate-800">Enter OTP</h2>
              <p className="text-slate-500 text-sm mt-1">6-digit OTP sent to <strong>{email}</strong></p>
            </div>
            <div className="space-y-4">
              <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
                placeholder="Enter 6-digit OTP" className="input-field text-center text-2xl font-bold tracking-widest" />
              <button onClick={verifyOTP} disabled={otp.length !== 6} className="btn-primary w-full">Continue</button>
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔒</div>
              <h2 className="text-xl font-bold text-slate-800">Set New Password</h2>
              <p className="text-slate-500 text-sm mt-1">Choose a strong password</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">New Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="input-field pl-10" />
                </div>
              </div>
              <button onClick={resetPassword} disabled={loading || !newPassword} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
