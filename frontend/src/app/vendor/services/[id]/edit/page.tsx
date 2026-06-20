"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ChevronLeft, Upload, X, Loader2, Save, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const CATEGORIES = ["Plumbing","Electrical","Carpentry","Painting","Cleaning","AC Repair","Appliance Repair","Pest Control","Gardening","Security"];

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.string().min(1),
  basePrice: z.number({ invalid_type_error: "Enter valid price" }).min(50),
  priceUnit: z.enum(["fixed", "per_hour", "per_visit"]),
  duration: z.number({ invalid_type_error: "Enter duration" }).min(15),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function EditServicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);

  const { data, isLoading } = useQuery(
    ["service-edit", id],
    () => api.get(`/services/${id}`).then((r) => r.data)
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      reset({
        title: s.title, description: s.description, category: s.category,
        basePrice: s.price?.base, priceUnit: s.price?.unit || "fixed",
        duration: s.duration, isActive: s.isActive,
      });
      setTags(s.tags || []);
      setImages(s.images || []);
    }
  }, [data, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "oneservice/services");
      const res = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImages((prev) => [...prev, res.data.url]);
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed."); }
    finally { setUploadingImg(false); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setTagInput(""); }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await api.patch(`/services/${id}`, {
        title: data.title, description: data.description, category: data.category,
        price: { base: data.basePrice, unit: data.priceUnit },
        duration: data.duration, isActive: data.isActive, images, tags,
      });
      toast.success("Service updated!");
      router.push("/vendor/services");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed.");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-400" size={36} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/vendor/services" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
          <span className="font-bold text-slate-800">Edit Service</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Service Information</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-slate-600">Active</span>
                  <input {...register("isActive")} type="checkbox" className="w-4 h-4 accent-primary-500" />
                </label>
              </div>

              <div>
                <label className="input-label">Title</label>
                <input {...register("title")} className="input-field" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="input-label">Category</label>
                <select {...register("category")} className="input-field cursor-pointer">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea {...register("description")} rows={4} className="input-field resize-none" />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h2 className="font-bold text-slate-800">Pricing & Duration</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Base Price (₹)</label>
                  <input {...register("basePrice", { valueAsNumber: true })} type="number" min="50" className="input-field" />
                  {errors.basePrice && <p className="text-red-500 text-xs mt-1">{errors.basePrice.message}</p>}
                </div>
                <div>
                  <label className="input-label">Price Type</label>
                  <select {...register("priceUnit")} className="input-field cursor-pointer">
                    <option value="fixed">Fixed</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_visit">Per Visit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Duration (minutes)</label>
                <input {...register("duration", { valueAsNumber: true })} type="number" min="15" step="15" className="input-field" />
              </div>
            </div>

            {/* Images */}
            <div className="glass-card p-6 space-y-3">
              <h2 className="font-bold text-slate-800">Images</h2>
              <div className="grid grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary-50 transition-colors">
                    {uploadingImg ? <Loader2 size={20} className="animate-spin text-primary-400" /> : <><Upload size={20} className="text-slate-400" /><span className="text-xs text-slate-400">Add</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                  </label>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="glass-card p-6 space-y-3">
              <h2 className="font-bold text-slate-800">Tags</h2>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..." className="input-field flex-1" />
                <button type="button" onClick={addTag} className="btn-secondary py-2 px-4"><Plus size={16} /></button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {tags.map((t) => (
                    <span key={t} className="badge-blue flex items-center gap-1 cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>
                      {t} <X size={11} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
