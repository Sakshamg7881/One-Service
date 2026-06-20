"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, Loader2, CheckCircle, Lock, Bell } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<"profile" | "password" | "notifications">("profile");
  const [uploading, setUploading] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: savingProfile } } = useForm({
    defaultValues: { name: user?.name || "", phone: user?.phone || "" },
  });

  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { isSubmitting: savingPass } } = useForm<{ currentPassword: string; newPassword: string; confirm: string }>();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "oneservice/avatars");
      const res = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await api.patch("/users/me", { avatar: res.data.url });
      updateUser({ avatar: res.data.url });
      toast.success("Avatar updated!");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); }
  };

  const saveProfile = async (data: any) => {
    try {
      const res = await api.patch("/users/me", data);
      updateUser(res.data.data);
      toast.success("Profile saved!");
    } catch (err: any) { toast.error(err.response?.data?.message || "Save failed."); }
  };

  const savePassword = async (data: any) => {
    if (data.newPassword !== data.confirm) { toast.error("Passwords don't match."); return; }
    try {
      await api.patch("/users/me/password", { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success("Password updated!");
      resetPass();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed."); }
  };

  const TABS = [
    { key: "profile",       label: "Profile",       icon: "👤" },
    { key: "password",      label: "Password",      icon: "🔒" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <span className="font-bold text-slate-800">Account Settings</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-primary-600">{user?.name?.charAt(0).toUpperCase()}</span>}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-primary-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-primary-600 transition-colors">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{user?.name}</p>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className={`badge mt-1 ${user?.role === "admin" ? "badge-red" : user?.role === "vendor" ? "badge-blue" : "badge-green"}`}>
              {user?.role}
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input {...regProfile("name")} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email <span className="text-slate-400 font-normal">(cannot change)</span></label>
                <input value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input {...regProfile("phone")} type="tel" className="input-field" placeholder="+91 98765 43210" />
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center justify-center gap-2">
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Password tab */}
        {tab === "password" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <form onSubmit={handlePass(savePassword)} className="space-y-4">
              {[
                { name: "currentPassword", label: "Current Password" },
                { name: "newPassword",     label: "New Password (min. 8 chars)" },
                { name: "confirm",         label: "Confirm New Password" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="input-label">{f.label}</label>
                  <input {...regPass(f.name as any)} type="password" className="input-field" placeholder="••••••••" />
                </div>
              ))}
              <button type="submit" disabled={savingPass} className="btn-primary flex items-center justify-center gap-2">
                {savingPass ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {savingPass ? "Updating..." : "Update Password"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Notifications tab */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-2">Notification Preferences</h3>
            {[
              { label: "Push Notifications", desc: "Receive real-time alerts in browser", key: "notifications" },
              { label: "Email Alerts", desc: "Booking confirmations, payment receipts, updates", key: "emailAlerts" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${(user?.preferences as any)?.[item.key] ? "bg-primary-500" : "bg-slate-200"}`}
                  onClick={async () => {
                    const val = !(user?.preferences as any)?.[item.key];
                    await api.patch("/users/me", { preferences: { ...(user?.preferences || {}), [item.key]: val } });
                    updateUser({ preferences: { ...(user?.preferences || {}) as any, [item.key]: val } });
                  }}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${(user?.preferences as any)?.[item.key] ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
