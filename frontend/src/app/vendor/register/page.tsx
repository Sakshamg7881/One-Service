"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ChevronLeft, Upload, X, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const CATEGORIES = ["Plumbing","Electrical","Carpentry","Painting","Cleaning","AC Repair","Appliance Repair","Pest Control","Gardening","Security"];

const schema = z.object({
  businessName: z.string().min(3, "Business name required"),
  description: z.string().min(20, "Description required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  city: z.string().min(2, "City required"),
  address: z.string().min(10, "Address required"),
});
type FormData = z.infer<typeof schema>;

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [govIdUrl, setGovIdUrl] = useState("");
  const [certUrls, setCertUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"govId" | "cert" | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categories: [] },
  });

  const uploadFile = async (file: File, type: "govId" | "cert") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "oneservice/vendor-docs");
      const res = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (type === "govId") setGovIdUrl(res.data.url);
      else setCertUrls((prev) => [...prev, res.data.url]);
      toast.success("Document uploaded!");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(null); }
  };

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    setValue("categories", next);
  };

  const onSubmit = async (data: FormData) => {
    if (!govIdUrl) { toast.error("Government ID is required."); return; }
    try {
      await api.post("/vendors/register", {
        businessName: data.businessName,
        description: data.description,
        categories: data.categories,
        govIdUrl,
        certificatesUrls: certUrls,
        location: { address: data.address, city: data.city },
      });
      updateUser({ role: "vendor" });
      toast.success("Application submitted! Awaiting admin approval.");
      router.push("/vendor/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Submission failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <span className="font-bold text-slate-800">Become a Vendor</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Info banner */}
        <div className="glass-card p-5 mb-6 flex items-start gap-3 border border-blue-100">
          <ShieldCheck size={22} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">Verification Process</p>
            <p className="text-slate-500 text-xs mt-0.5">Submit your application with a valid government ID. Our team will review and approve within 24 hours. You'll be notified via email.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Business info */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-slate-800">Business Information</h2>
            <div>
              <label className="input-label">Business Name</label>
              <input {...register("businessName")} className="input-field" placeholder="e.g. Sharma Plumbing Services" />
              {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea {...register("description")} rows={3} className="input-field resize-none" placeholder="Describe your business, experience, and specializations..." />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">City</label>
                <input {...register("city")} className="input-field" placeholder="Mumbai" />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="input-label">Full Address</label>
                <input {...register("address")} className="input-field" placeholder="Street, Area, City" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="glass-card p-6">
            <h2 className="font-bold text-slate-800 mb-3">Service Categories</h2>
            <p className="text-slate-500 text-sm mb-4">Select all categories you offer</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button type="button" key={cat} onClick={() => toggleCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                    selectedCategories.includes(cat)
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            {errors.categories && <p className="text-red-500 text-xs mt-2">{errors.categories.message}</p>}
          </div>

          {/* Documents */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-slate-800">Identity Verification</h2>

            {/* Gov ID */}
            <div>
              <label className="input-label">Government ID <span className="text-red-400">*</span></label>
              <p className="text-slate-400 text-xs mb-2">Aadhaar, PAN, Passport, Voter ID, or Driving License</p>
              {govIdUrl ? (
                <div className="relative inline-block">
                  <img src={govIdUrl} alt="Gov ID" className="h-24 rounded-xl object-cover border border-slate-200" />
                  <button type="button" onClick={() => setGovIdUrl("")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-300 cursor-pointer transition-colors hover:bg-primary-50">
                  {uploading === "govId" ? <Loader2 size={20} className="animate-spin text-primary-400" /> : <Upload size={20} className="text-slate-400" />}
                  <span className="text-slate-500 text-sm">{uploading === "govId" ? "Uploading..." : "Click to upload ID document"}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "govId")} disabled={!!uploading} />
                </label>
              )}
            </div>

            {/* Certificates */}
            <div>
              <label className="input-label">Skill Certificates <span className="text-slate-400 font-normal">(optional)</span></label>
              <p className="text-slate-400 text-xs mb-2">Trade certificates, training documents, etc.</p>
              <div className="flex gap-3 flex-wrap">
                {certUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`cert-${i}`} className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
                    <button type="button" onClick={() => setCertUrls(certUrls.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                  </div>
                ))}
                {certUrls.length < 5 && (
                  <label className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary-50 transition-colors">
                    {uploading === "cert" ? <Loader2 size={16} className="animate-spin text-primary-400" /> : <><Upload size={16} className="text-slate-400" /><span className="text-xs text-slate-400">Add</span></>}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "cert")} disabled={!!uploading} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting || !govIdUrl} className="btn-primary w-full flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} />}
            {isSubmitting ? "Submitting Application..." : "Submit Application"}
          </button>
          <p className="text-xs text-slate-400 text-center">By submitting, you agree to our Terms of Service and Vendor Agreement</p>
        </form>
      </div>
    </div>
  );
}
