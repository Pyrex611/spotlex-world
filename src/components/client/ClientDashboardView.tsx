'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Truck, ArrowUpRight, Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ClientDashboardView({ property, history, invoices }: { property: any, history: any[], invoices: any[] }) {
  const supabase = createClient()
  const [arrivalNotification, setArrivalNotification] = useState<string | null>(null)

  const totalArrears = invoices.filter(inv => inv.status !== 'paid').reduce((acc, curr) => acc + Number(curr.total_due), 0)
  const lastCollection = history.length > 0 ? history[0] : null
  const dayName = property?.collection_day_of_week !== null && property?.collection_day_of_week !== undefined
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][property.collection_day_of_week] 
    : "Pending"

  useEffect(() => {
    if (!property?.id) return;
    const channel = supabase.channel('collection-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'collections', filter: `property_id=eq.${property.id}` },
      (payload) => {
        if (payload.new.status === 'arrived') {
          setArrivalNotification("Our truck is at your gate!")
          toast.success("🚛 Truck Arrived!", { duration: 15000 });
        }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [property?.id, supabase])

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
      {arrivalNotification && (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border-2 border-green-500 flex justify-between items-center animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-2xl animate-bounce"><Truck className="w-6 h-6 text-slate-900" /></div>
            <div>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Live Update</p>
              <p className="text-base font-bold">{arrivalNotification}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Welcome to your SpotlexWorld command center.</p>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black text-green-600 uppercase tracking-widest shadow-sm flex items-center gap-2 w-fit">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active Status
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/client/schedule" className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-green-200 hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[240px]">
          <div className="flex justify-between items-start">
            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-green-50 transition-colors">
              <MapPin className="w-6 h-6 text-slate-700 group-hover:text-green-700 transition-colors" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Pickup Schedule
            </p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{dayName}s</h2>
            <p className="text-xs font-medium text-slate-500 truncate leading-relaxed">
              {property?.address_text || 'No location set'}
            </p>
          </div>
        </Link>

        <Link href="/client/billing" className="group bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[240px] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet className="w-32 h-32" /></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="bg-white/10 p-3 rounded-2xl">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition-colors" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              Outstanding Balance
            </p>
            <h2 className="text-4xl font-black tracking-tighter mb-2">₦{totalArrears.toLocaleString()}</h2>
            {totalArrears > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-red-500/20">
                <AlertCircle className="w-3 h-3" /> Action Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" /> Fully Settled
              </span>
            )}
          </div>
        </Link>

        <Link href="/client/history" className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-blue-200 hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[240px] md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 transition-colors">
              <Clock className="w-6 h-6 text-slate-700 group-hover:text-blue-700 transition-colors" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              Last Collection
            </p>
            {lastCollection ? (
              <>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                  {new Date(lastCollection.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${lastCollection.status === 'collected' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {lastCollection.status.replace('_', ' ')}
                  </span>
                  {!lastCollection.client_rating && (
                     <span className="text-[10px] font-bold text-slate-400">Click to rate</span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm font-medium text-slate-500">No recent collections found.</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}