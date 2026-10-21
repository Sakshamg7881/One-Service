"use client";

import Link from "next/link";
import { useQuery } from "react-query";
import { Loader2, MapPin, Star } from "lucide-react";
import api from "@/lib/api";

export default function VendorsPage() {
  const { data, isLoading, error } = useQuery(
    "vendors",
    () => api.get("/vendors").then((res) => res.data)
  );

  const vendors = data?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Failed to load vendors.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-8">Find Trusted Vendors</h1>

      {vendors.length === 0 ? (
        <p>No vendors available.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor: any) => (
            <div
              key={vendor._id}
              className="rounded-xl border p-5 shadow hover:shadow-lg transition"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold mb-4">
                {vendor.businessName?.charAt(0)}
              </div>

              <h2 className="text-xl font-semibold">
                {vendor.businessName}
              </h2>

              <div className="flex items-center gap-2 text-gray-500 mt-2">
                <MapPin size={16} />
                {vendor.location?.city || "Unknown"}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Star
                  size={16}
                  className="text-yellow-500 fill-yellow-500"
                />
                {vendor.rating || 0}
              </div>

              <Link
                href={`/vendors/${vendor._id}`}
                className="mt-5 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}