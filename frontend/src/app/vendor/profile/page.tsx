"use client";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronLeft, Save, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const CATEGORIES = ["Plumbing","Electrical","Carpentry","Painting","Cleaning","AC Repair","Appliance Repair","Pest Control","Gardening","Security"];

export default function VendorProfilePage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data } = useQuery("vendor-me", () => api.get("/vendors/me").then((r) => r.data), { enabled: isAuthenticated });
  const vendor = data?.data;

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: { businessName: "", description: "", categories: [] as string[], city: "", address: "" },
  });

  useEffect(() => {
    if (vendor) {
      reset({
        businessName: vendor.businessName || "",
        description: vendor.description || "",
        categories: vendor.categories || [],
        city: vendor.location?.city || "",
        address: vendor.location?.address || "",
      });
    }
  }, [vendor, reset]);

  const watchedCategories: string[] = watch("categories") || [];

  const toggleCat = (cat: string) => {
    const current = watchedCategories;
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    setValue("categories", next);
  };

const mutation = useMutation(
  (data: any) =>
    api.patch("/vendors/me", {
      businessName: data.businessName,
      description: data.description,
      categories: data.categories,
      location: { city: data.city, address: data.address },
    }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries("vendor-me");
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Update failed.");
    },
  }
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/vendor/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <span className="font-bold text-slate-800">Edit Vendor Profile</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Verified badge */}
          {vendor?.isVerified && (
            <div className="glass-card p-4 mb-5 flex items-center gap-3 border border-green-100">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">✅</div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Verified Vendor</p>
                <p className="text-green-600 text-xs">Your account is verified. ID: {vendor.vendorId}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">

            <div className="glass-card p-6 space-y-4">
              <h2 className="font-bold text-slate-800">Business Details</h2>

              <div>
                <label className="input-label">Business Name</label>
                <input {...register("businessName", { required: true })} className="input-field" />
              </div>

              <div>
                <label className="input-label">About Your Business</label>
                <textarea {...register("description")} rows={4} className="input-field resize-none"
                  placeholder="Describe your experience, expertise, and what makes you stand out..." />
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-bold text-slate-800 mb-3">Service Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button type="button" key={cat} onClick={() => toggleCat(cat)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      watchedCategories.includes(cat)
                        ? "bg-primary-500 text-white border-primary-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={17} className="text-primary-500" /> Location
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">City</label>
                  <input {...register("city")} className="input-field" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="input-label">Area / Address</label>
                  <input {...register("address")} className="input-field" placeholder="Bandra West" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || mutation.isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {(isSubmitting || mutation.isLoading) ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {(isSubmitting || mutation.isLoading) ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
