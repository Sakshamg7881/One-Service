"use client";
import { useState } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, Star, MapPin, Clock, ChevronDown, Loader2 } from "lucide-react";
import api from "@/lib/api";

const CATEGORIES = ["All","Plumbing","Electrical","Carpentry","Painting","Cleaning","AC Repair","Appliance Repair","Pest Control","Gardening","Security"];
const SORT_OPTIONS = [
  { value: "rating",     label: "Best Rated" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest",     label: "Newest" },
];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("rating");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = {
    ...(category !== "All" && { category }),
    ...(search && { search }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    ...(minRating && { rating: minRating }),
    sortBy, page, limit: 12,
  };

  const { data, isLoading, isFetching } = useQuery(
    ["services", queryParams],
    () => api.get("/services", { params: queryParams }).then((r) => r.data),
    { keepPreviousData: true }
  );

  const services = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <span className="font-bold text-slate-800">OneService</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
          <Link href="/auth/signup" className="btn-primary text-sm py-2">Sign Up</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
            <Filter size={16} /> Filters <ChevronDown size={14} className={showFilters ? "rotate-180" : ""} />
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field w-auto cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6 grid md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Min Price (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Max Price (₹)</label>
              <input type="number" className="input-field" placeholder="5000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label className="input-label">Min Rating</label>
              <select className="input-field cursor-pointer" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                <option value="">Any</option>
                {[4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}★ & above</option>)}
              </select>
            </div>
          </motion.div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="animate-spin text-primary-400" size={40} />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-slate-500 text-lg">No services found</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${isFetching ? "opacity-70" : ""} transition-opacity`}>
              {services.map((service: any, i: number) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/services/${service._id}`}>
                    <div className="service-card h-full">
                      {/* Image */}
                      <div className="h-44 bg-gradient-to-br from-primary-100 to-blue-100 relative overflow-hidden">
                        {service.images?.[0] ? (
                          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {service.category === "Plumbing" ? "🔧" : service.category === "Electrical" ? "⚡" : service.category === "Cleaning" ? "✨" : "🛠️"}
                          </div>
                        )}
                        {service.vendor?.isVerified && (
                          <span className="absolute top-3 left-3 badge-blue text-xs">✓ Verified</span>
                        )}
                        <span className="absolute top-3 right-3 badge bg-white/90 text-slate-700">{service.category}</span>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">{service.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{service.description}</p>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" /> {service.rating?.toFixed(1) || "New"} ({service.totalReviews})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {service.duration} min
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-slate-800">₹{service.price?.base}</span>
                            <span className="text-xs text-slate-400 ml-1">{service.price?.unit === "per_hour" ? "/hr" : ""}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={11} />
                            <span className="truncate max-w-20">{service.vendor?.businessName || "Vendor"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 text-sm">← Prev</button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? "bg-primary-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-primary-300"}`}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 text-sm">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
