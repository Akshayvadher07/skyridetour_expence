import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { 
  Building2, 
  MapPin, 
  Package, 
  ShieldCheck, 
  IndianRupee,
  Maximize,
  Calendar,
  FileText,
  ArrowLeft,
  Warehouse,
  BadgeCheck,
  Clock,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import BookingActionPanel from "./BookingActionPanel";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function getWarehouse(id: string) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Try Mongo ObjectId first, fall back to string id (Prisma-style)
    let warehouse = null;
    if (ObjectId.isValid(id)) {
      warehouse = await db.collection("warehouses").findOne({ _id: new ObjectId(id) });
    }
    if (!warehouse) {
      warehouse = await db.collection("warehouses").findOne({ id });
    }
    return warehouse;
  } catch {
    return null;
  }
}

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const warehouse = await getWarehouse(id);

  if (!warehouse) return notFound();

  // Parse images from stored JSON string
  let images: string[] = [];
  try {
    if (warehouse.images) {
      images = JSON.parse(warehouse.images);
    }
  } catch {
    images = warehouse.images ? [warehouse.images] : [];
  }

  const primaryImage = images[0] || null;
  const secondaryImages = images.slice(1, 5);

  const capacityUsed = warehouse.totalCapacity - warehouse.availableCapacity;
  const capacityPct = Math.round((capacityUsed / warehouse.totalCapacity) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-0.5">
          <Link href="/dashboard/client/book" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors mb-1">
            <ArrowLeft className="h-3 w-3" /> Back to Network Scan
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">
            Facility <span className="text-slate-400 font-normal not-italic">Details</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{warehouse.name}</p>
        </div>
        <Badge className={cn(
          "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-none",
          warehouse.status === "APPROVED" ? "bg-emerald-600 text-white" :
          warehouse.status === "PENDING" ? "bg-amber-500 text-white" :
          "bg-red-600 text-white"
        )}>
          {warehouse.status}
        </Badge>
      </div>

      {/* Main Layout: Content + Booking Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images + Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Image Gallery */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-2xl overflow-hidden">
            {/* Primary large image */}
            <div className="col-span-3 row-span-2 relative bg-slate-100">
              {primaryImage ? (
                <img src={primaryImage} alt={warehouse.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                  <Warehouse className="h-16 w-16" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">No Primary Image</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-black/60 text-white border-none text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                  Primary View
                </Badge>
              </div>
            </div>

            {/* Secondary thumbnails column */}
            <div className="col-span-1 row-span-2 grid grid-rows-2 gap-2">
              {[0, 1].map((i) => (
                <div key={i} className="relative bg-slate-100 rounded-xl overflow-hidden">
                  {secondaryImages[i] ? (
                    <img src={secondaryImages[i]} alt={`View ${i + 2}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                  {i === 1 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-black text-sm">+{images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Core Spec Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SpecCard
              icon={Maximize}
              label="Total Capacity"
              value={`${warehouse.totalCapacity?.toLocaleString()} MT`}
              accent="indigo"
            />
            <SpecCard
              icon={Package}
              label="Available Space"
              value={`${warehouse.availableCapacity?.toLocaleString()} MT`}
              accent="emerald"
            />
            <SpecCard
              icon={IndianRupee}
              label="Rate / MT"
              value={`₹${warehouse.pricing?.toLocaleString()}`}
              accent="orange"
            />
            <SpecCard
              icon={Warehouse}
              label="Storage Type"
              value={warehouse.storageType || "Dry"}
              accent="slate"
            />
          </div>

          {/* Capacity Utilization Bar */}
          <Card className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capacity Utilization</p>
              <span className="text-[10px] font-black text-indigo-600">{capacityPct}% Occupied</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>{capacityUsed?.toLocaleString()} MT Used</span>
              <span>{warehouse.availableCapacity?.toLocaleString()} MT Free</span>
            </div>
          </Card>

          {/* Technical Details */}
          <Card className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
            <div className="bg-slate-900 px-5 py-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Specifications</p>
            </div>
            <div className="divide-y divide-slate-50">
              <DetailRow icon={MapPin} label="Node Address" value={warehouse.address || "—"} />
              <DetailRow icon={Calendar} label="Available From" value={warehouse.availableFrom ? new Date(warehouse.availableFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Immediate"} />
              <DetailRow icon={Package} label="Materials Allowed" value={warehouse.materialsAllowed || "General Storage"} />
              <DetailRow icon={FileText} label="GST Number" value={warehouse.gstNumber || "Not Provided"} />
              <DetailRow 
                icon={BadgeCheck} 
                label="WDRA Registration" 
                value={warehouse.wdraStatus ? "Registered ✓" : "Not Registered"} 
                valueClass={warehouse.wdraStatus ? "text-emerald-600" : "text-slate-400"}
              />
              {warehouse.features && (
                <DetailRow icon={ShieldCheck} label="Facilities" value={
                  Array.isArray(warehouse.features) ? warehouse.features.join(", ") : warehouse.features
                } />
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Booking Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <BookingActionPanel 
              warehouseId={warehouse._id?.toString() || warehouse.id}
              warehouseName={warehouse.name}
              pricing={warehouse.pricing}
              availableCapacity={warehouse.availableCapacity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  const accents: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };
  return (
    <Card className="p-4 border border-slate-100 rounded-2xl bg-white space-y-2 hover:shadow-md transition-shadow">
      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center border", accents[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{value}</p>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-center gap-3">
        <Icon className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={cn("text-[10px] font-black text-slate-700 uppercase tracking-tight text-right max-w-[180px] line-clamp-1", valueClass)}>
        {value}
      </span>
    </div>
  );
}
