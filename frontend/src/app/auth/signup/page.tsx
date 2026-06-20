"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number").optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["user", "vendor"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "user" | "vendor") || "user";
  const [showPass, setShowPass] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/auth/signup", {
        name: data.name, email: data.email,
        phone: data.phone, password: data.password, role: data.role,
      });
      setUserId(res.data.userId);
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) return toast.error("Enter valid 6-digit OTP");
    setOtpLoading(true);
    try {
      await api.post("/auth/verify-otp", { userId, otp });
      toast.success("Email verified! Please login.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP Verification screen ──────────────────────────────
  if (userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
          <p className="text-slate-500 text-sm mb-8">We sent a 6-digit OTP to your email address.</p>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
            placeholder="Enter 6-digit OTP"
            className="input-field text-center text-2xl font-bold tracking-widest mb-6"
          />
          <button onClick={handleVerifyOTP} disabled={otpLoading} className="btn-primary w-full flex items-center justify-center gap-2">
            {otpLoading && <Loader2 size={17} className="animate-spin" />}
            Verify Email
          </button>
          <p className="text-xs text-slate-400 mt-4">Didn't receive it? Check spam or <button className="text-primary-600 hover:underline" onClick={() => setUserId(null)}>try again</button></p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold">OS</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">OneService</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of satisfied customers</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6">
          {(["user", "vendor"] as const).map((r) => (
            <label
              key={r}
              className={`flex-1 py-2.5 text-center text-sm font-medium cursor-pointer transition-colors ${
                watch("role") === r ? "bg-primary-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input {...register("role")} type="radio" value={r} className="hidden" />
              {r === "user" ? "👤 Customer" : "🔧 Service Vendor"}
            </label>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="input-label">Full Name</label>
            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register("name")} placeholder="John Doe" className="input-field pl-10" />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="input-label">Email Address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register("email")} type="email" placeholder="you@example.com" className="input-field pl-10" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="input-label">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register("phone")} type="tel" placeholder="+91 98765 43210" className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register("password")} type={showPass ? "text" : "password"} placeholder="Min. 8 characters" className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="input-label">Confirm Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register("confirmPassword")} type="password" placeholder="••••••••" className="input-field pl-10" />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
