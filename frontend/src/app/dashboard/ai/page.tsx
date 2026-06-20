"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Upload, Loader2, Sparkles, AlertTriangle,
  IndianRupee, ArrowRight, Star, MapPin, CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  low:       { label: "Low",       cls: "badge-green",  icon: "🟢" },
  medium:    { label: "Medium",    cls: "badge-yellow", icon: "🟡" },
  high:      { label: "High",      cls: "badge-red",    icon: "🔴" },
  emergency: { label: "Emergency", cls: "badge bg-red-600 text-white", icon: "🚨" },
};

export default function AIAnalyzerPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setResult(null);
    setUploading(true);

    try {
      // Upload to Cloudinary via backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "oneservice/ai-analysis");

      const uploadRes = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = uploadRes.data.url;
      setUploading(false);
      setAnalyzing(true);

      // Get user location
      let userLocation = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (_) {}

      // AI analysis
      const analysisRes = await api.post("/ai/analyze-image", { imageUrl, userLocation });
      setResult({ ...analysisRes.data.data, imageUrl });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Analysis failed. Try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || analyzing,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <Sparkles size={18} className="text-primary-500" />
        <span className="font-bold text-slate-800">AI Problem Analyzer</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            Snap a photo,<br /><span className="text-gradient">AI finds the fix</span>
          </h1>
          <p className="text-slate-500">Upload a photo of your home problem and our AI will identify the issue, estimate the cost, and recommend the best professionals near you.</p>
        </motion.div>

        {/* Upload area */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
            isDragActive ? "border-primary-400 bg-primary-50" : "border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 bg-white"
          } ${(uploading || analyzing) ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <input {...getInputProps()} />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Uploaded" className="max-h-64 mx-auto rounded-xl object-contain" />
              {(uploading || analyzing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={32} />
                    <p className="text-slate-600 font-medium text-sm">
                      {uploading ? "Uploading image..." : "🤖 AI is analyzing..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Upload size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-1">
                {isDragActive ? "Drop your photo here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-slate-400 text-sm">JPG, PNG, WEBP · Max 10MB</p>
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* Problem analysis */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-primary-500" />
                  <h2 className="font-bold text-slate-800">AI Analysis Result</h2>
                </div>

                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{result.analysis?.problemType || "Problem Detected"}</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{result.analysis?.problemDescription}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {result.analysis?.severity && (
                      <span className={SEVERITY_CONFIG[result.analysis.severity]?.cls || "badge-gray"}>
                        {SEVERITY_CONFIG[result.analysis.severity]?.icon} {SEVERITY_CONFIG[result.analysis.severity]?.label} Severity
                      </span>
                    )}
                    {result.analysis?.suggestedCategory && (
                      <span className="badge-blue">{result.analysis.suggestedCategory}</span>
                    )}
                  </div>
                </div>

                {result.analysis?.immediateAction && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800 text-sm">Immediate Action</p>
                      <p className="text-yellow-700 text-sm mt-0.5">{result.analysis.immediateAction}</p>
                    </div>
                  </div>
                )}

                {result.analysis?.estimatedCostRange && (
                  <div className="mt-4 bg-green-50 rounded-xl p-4 flex items-center gap-3">
                    <IndianRupee size={18} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">Estimated Cost Range</p>
                      <p className="text-green-700 text-sm">₹{result.analysis.estimatedCostRange.min} – ₹{result.analysis.estimatedCostRange.max}</p>
                    </div>
                  </div>
                )}

                {result.analysis?.tags?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    {result.analysis.tags.map((t: string) => <span key={t} className="badge-gray">{t}</span>)}
                  </div>
                )}
              </div>

              {/* Suggested vendors */}
              {result.suggestedVendors?.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="font-bold text-slate-800 mb-4">🎯 Recommended Vendors Near You</h2>
                  <div className="space-y-3">
                    {result.suggestedVendors.map((v: any) => (
                      <Link key={v._id} href={`/vendors/${v._id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors cursor-pointer">
                          <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                            {v.businessName?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800 text-sm">{v.businessName}</p>
                              {v.isVerified && <span className="badge-blue text-xs">✓ Verified</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /> {v.rating?.toFixed(1)}</span>
                              <span className="flex items-center gap-1"><MapPin size={11} /> Nearby</span>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Search service CTA */}
              {result.analysis?.suggestedCategory && (
                <Link href={`/services?category=${encodeURIComponent(result.analysis.suggestedCategory)}`}>
                  <div className="btn-primary w-full flex items-center justify-center gap-2">
                    <CheckCircle size={17} />
                    Browse {result.analysis.suggestedCategory} Services
                  </div>
                </Link>
              )}

              {/* Re-analyze button */}
              <button
                onClick={() => { setPreview(null); setResult(null); }}
                className="btn-secondary w-full"
              >
                Upload Another Photo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        {!result && !preview && (
          <div className="glass-card p-5 mt-6">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">📸 Tips for best results</h3>
            <ul className="space-y-1.5 text-sm text-slate-500">
              {["Take a clear, well-lit photo of the problem", "Show the affected area as closely as possible", "Include surrounding context if helpful", "Works best for: leaks, cracks, broken fixtures, electrical issues"].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle size={13} className="text-green-400 flex-shrink-0 mt-0.5" />{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
