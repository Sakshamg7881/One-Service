"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, IndianRupee, Sparkles, Loader2,
  TrendingUp, CheckCircle, XCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function PriceNegotiationPage() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [proposedPrice, setProposedPrice] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: serviceData } = useQuery(
    ["service-neg", serviceId],
    () => api.get(`/services/${serviceId}`).then((r) => r.data),
    { enabled: !!serviceId }
  );
  const service = serviceData?.data;

  const handleAnalyze = async () => {
    if (!proposedPrice || !serviceId) { toast.error("Enter your proposed price."); return; }
    setLoading(true);
    try {
      const res = await api.post("/ai/price-negotiation", {
        serviceId,
        proposedPrice: Number(proposedPrice),
        context,
      });
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const REC_CONFIG: Record<string, { label: string; cls: string; icon: any; desc: string }> = {
    accept:  { label: "Accept the listed price",     cls: "text-green-700 bg-green-50 border-green-200",  icon: CheckCircle, desc: "Your offer is fair — the vendor is likely to accept" },
    counter: { label: "Try a counter offer",          cls: "text-yellow-700 bg-yellow-50 border-yellow-200",icon: TrendingUp,  desc: "There's room to negotiate — try the suggested counter" },
    reject:  { label: "Price too low",               cls: "text-red-700 bg-red-50 border-red-200",        icon: XCircle,     desc: "Your offer is well below market rate" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href={serviceId ? `/services/${serviceId}` : "/services"} className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <Sparkles size={18} className="text-primary-500" />
        <span className="font-bold text-slate-800">AI Price Negotiation</span>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Get a Fair Price</h1>
          <p className="text-slate-500 text-sm">Our AI analyzes market rates and vendor ratings to help you negotiate confidently.</p>
        </motion.div>

        {/* Service info */}
        {service && (
          <div className="glass-card p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">🛠️</div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{service.title}</p>
              <p className="text-slate-500 text-xs">{service.vendor?.businessName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Listed price</p>
              <p className="font-bold text-primary-600">₹{service.price?.base}</p>
            </div>
          </div>
        )}

        {/* Input form */}
        <div className="glass-card p-6 space-y-4 mb-5">
          <div>
            <label className="input-label">Your Proposed Price (₹)</label>
            <div className="relative">
              <IndianRupee size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Enter your offer..."
                className="input-field pl-10"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Context <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="e.g. I'm a repeat customer, the job is small, I can be flexible on timing..."
              className="input-field resize-none"
            />
          </div>

          <button onClick={handleAnalyze} disabled={loading || !proposedPrice}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
            {loading ? "Analyzing..." : "Get AI Advice"}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Recommendation */}
              {result.recommendation && (() => {
                const cfg = REC_CONFIG[result.recommendation];
                return (
                  <div className={`glass-card p-5 border ${cfg.cls}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <cfg.icon size={22} />
                      <p className="font-bold text-lg">{cfg.label}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{cfg.desc}</p>
                  </div>
                );
              })()}

              {/* Fair range */}
              {result.fairRangeMin && result.fairRangeMax && (
                <div className="glass-card p-5">
                  <h3 className="font-bold text-slate-800 mb-4">Market Price Analysis</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Min Fair Price</p>
                      <p className="text-xl font-bold text-green-600">₹{result.fairRangeMin}</p>
                    </div>
                    <div className="bg-primary-50 rounded-xl p-4 border-2 border-primary-200">
                      <p className="text-xs text-primary-600 mb-1">Your Offer</p>
                      <p className="text-xl font-bold text-primary-600">₹{proposedPrice}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Max Fair Price</p>
                      <p className="text-xl font-bold text-slate-700">₹{result.fairRangeMax}</p>
                    </div>
                  </div>

                  {result.counterOffer && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                      <TrendingUp size={18} className="text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-semibold text-sm">Suggested Counter Offer</p>
                        <p className="text-yellow-700 text-xl font-bold">₹{result.counterOffer}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-800 mb-2">AI Explanation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{result.explanation}</p>
                </div>
              )}

              {/* Tips */}
              {result.tips?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-800 mb-3">Negotiation Tips</h3>
                  <ul className="space-y-2">
                    {result.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {serviceId && (
                <Link href={`/services/${serviceId}`} className="btn-primary w-full flex items-center justify-center gap-2">
                  Back to Service <ArrowRight size={16} />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
