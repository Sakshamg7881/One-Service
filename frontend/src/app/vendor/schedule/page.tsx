"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Save, Loader2, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return `${h}:00`;
});

interface DaySlot { day: string; enabled: boolean; from: string; to: string; }

const DEFAULT_SLOTS: DaySlot[] = DAYS.map((day) => ({
  day, enabled: !["Sun"].includes(day), from: "09:00", to: "18:00",
}));

export default function VendorSchedulePage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<DaySlot[]>(DEFAULT_SLOTS);
  const [isOnline, setIsOnline] = useState(false);
  const { useSocket } = require("@/hooks/useSocket");
  const socket = useSocket();

  const { data: vendorData, isLoading } = useQuery(
    "vendor-me",
    () => api.get("/vendors/me").then((r) => r.data),
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (vendorData?.data) {
      const v = vendorData.data;
      setIsOnline(v.availability?.isOnline || false);
      if (v.availability?.slots?.length > 0) {
        const loaded = DAYS.map((day) => {
          const found = v.availability.slots.find((s: any) => s.day === day);
          return found
            ? { day, enabled: true, from: found.from, to: found.to }
            : { day, enabled: false, from: "09:00", to: "18:00" };
        });
        setSlots(loaded);
      }
    }
  }, [vendorData]);

const saveMutation = useMutation(
  () =>
    api.patch("/vendors/me", {
      availability: {
        isOnline,
        slots: slots
          .filter((s) => s.enabled)
          .map(({ day, from, to }) => ({ day, from, to })),
      },
    }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries("vendor-me");
      toast.success("Schedule saved!");

      // Emit online status to socket
      if (socket) socket.emit("vendor_status", { isOnline });
    },
    onError: () => {
      toast.error("Save failed.");
    },
  }
);

  const toggleDay = (day: string) => {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSlot = (day: string, field: "from" | "to", value: string) => {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, [field]: value } : s));
  };

  const enabledCount = slots.filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/vendor/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
          <Clock size={18} className="text-primary-500" />
          <span className="font-bold text-slate-800">Availability Schedule</span>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}
          className="btn-primary text-sm py-2 flex items-center gap-2">
          {saveMutation.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Schedule
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Online status toggle */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Online Status</p>
              <p className="text-slate-500 text-sm mt-0.5">
                {isOnline ? "You're visible to customers and can receive bookings" : "You're offline — customers can't book you"}
              </p>
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className="flex-shrink-0">
              {isOnline
                ? <ToggleRight size={44} className="text-green-500" />
                : <ToggleLeft size={44} className="text-slate-300" />}
            </button>
          </div>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
        </motion.div>

        {/* Weekly schedule */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Weekly Schedule</h2>
            <span className="text-slate-400 text-sm">{enabledCount} of 7 days active</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-primary-400" size={28} /></div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <motion.div key={slot.day} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${slot.enabled ? "border-primary-200 bg-primary-50/50" : "border-slate-100 bg-slate-50/50 opacity-60"}`}>

                  {/* Day toggle */}
                  <button onClick={() => toggleDay(slot.day)} className="flex-shrink-0 flex items-center gap-2 min-w-[110px]">
                    {slot.enabled
                      ? <ToggleRight size={28} className="text-primary-500" />
                      : <ToggleLeft size={28} className="text-slate-300" />}
                    <span className={`text-sm font-semibold ${slot.enabled ? "text-slate-800" : "text-slate-400"}`}>
                      {DAY_LABELS[slot.day]}
                    </span>
                  </button>

                  {/* Time pickers */}
                  {slot.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={slot.from}
                        onChange={(e) => updateSlot(slot.day, "from", e.target.value)}
                        className="input-field py-1.5 text-sm cursor-pointer flex-1"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-slate-400 text-sm flex-shrink-0">to</span>
                      <select
                        value={slot.to}
                        onChange={(e) => updateSlot(slot.day, "to", e.target.value)}
                        className="input-field py-1.5 text-sm cursor-pointer flex-1"
                      >
                        {TIME_OPTIONS.filter((t) => t > slot.from).map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-xs text-primary-600 bg-primary-100 px-2 py-1 rounded-lg flex-shrink-0 font-medium">
                        {(() => {
                          const [fh] = slot.from.split(":").map(Number);
                          const [th] = slot.to.split(":").map(Number);
                          return `${th - fh}h`;
                        })()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm flex-1">Day off</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">💡 Scheduling Tips</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            {[
              "Vendors available on weekends get 40% more bookings",
              "Keep your schedule accurate to avoid cancellations",
              "Toggle Online/Offline instantly when plans change",
              "Set longer hours to capture urgent bookings",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-green-400 flex-shrink-0 mt-0.5" />{tip}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {saveMutation.isLoading ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {saveMutation.isLoading ? "Saving..." : "Save Schedule"}
        </button>
      </div>
    </div>
  );
}
