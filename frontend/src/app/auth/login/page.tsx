"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/auth/login", data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);

      // Redirect based on role
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "vendor") router.push("/vendor/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold">OS</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">OneService</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="input-label">Email Address</label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register("password")}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-primary-600 font-semibold hover:underline">
            Sign Up Free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
