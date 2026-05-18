"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  Calendar, 
  Maximize,
  Package,
  ArrowRight,
  IndianRupee,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitClientRequest } from "@/lib/actions/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  warehouseId: string;
  warehouseName: string;
  pricing: number;
  availableCapacity: number;
}

export default function BookingActionPanel({ warehouseId, warehouseName, pricing, availableCapacity }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    commodity: "",
    weight: "",
    startDate: "",
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weight = parseFloat(formData.weight) || 0;
  const estimatedCost = weight * pricing;

  const handleBook = async () => {
    if (!formData.commodity || !formData.weight || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all fields before booking.");
      return;
    }
    if (weight > availableCapacity) {
      toast.error(`Requested tonnage exceeds available capacity of ${availableCapacity} MT.`);
      return;
    }

    setIsSubmitting(true);
    const result = await submitClientRequest({
      warehouseId,
      commodityType: formData.commodity,
      weight,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    });

    if (result.success) {
      toast.success("Logistics request transmitted to node owner!");
      router.push("/dashboard/client/history");
    } else {
      toast.error(result.error || "Booking failed. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white">
      {/* Panel Header */}
      <div className="bg-[#0f172a] p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <ShieldCheck className="h-20 w-20 text-white" />
        </div>
        <Badge className="bg-orange-600 text-white border-none font-black text-[8px] uppercase tracking-[0.2em] mb-3 italic">
          Contract Authorization
        </Badge>
        <h2 className="text-base font-black text-white uppercase tracking-tight leading-tight">Book This Space</h2>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{warehouseName}</p>
      </div>

      {/* Pricing Summary */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rate</span>
        </div>
        <span className="text-sm font-black text-slate-900">₹{pricing?.toLocaleString()} <span className="text-[9px] font-bold text-slate-400">/ MT</span></span>
      </div>

      <div className="p-5 space-y-4">
        {/* Commodity */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Package className="h-3 w-3 text-indigo-500" /> Commodity
          </label>
          <input
            value={formData.commodity}
            onChange={e => setFormData({...formData, commodity: e.target.value})}
            placeholder="e.g. WHEAT, STEEL"
            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
          />
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Maximize className="h-3 w-3 text-indigo-500" /> Tonnage Required (MT)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={e => setFormData({...formData, weight: e.target.value})}
            placeholder={`Max ${availableCapacity} MT`}
            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
          />
        </div>

        {/* Dates */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-indigo-500" /> Operational Window
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-indigo-600 transition-all"
            />
            <div className="flex items-center gap-2 text-[9px] text-slate-300 font-black uppercase tracking-widest justify-center">
              <ArrowRight className="h-3 w-3" /> To
            </div>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Estimated Cost */}
        {weight > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Estimated Value</p>
              <p className="text-xl font-black text-indigo-700 tracking-tighter">
                ₹{estimatedCost.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <IndianRupee className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleBook}
          disabled={isSubmitting}
          className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-900/20 transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Confirm & Send Request
            </div>
          )}
        </Button>

        <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">
          Subject to node owner authorization within 24 hrs
        </p>
      </div>
    </Card>
  );
}
