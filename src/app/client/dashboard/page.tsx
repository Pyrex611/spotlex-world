'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/BrandLogo'
import { Calendar, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function ClientDashboard({ property }: any) {
  const supabase = createClient()

  useEffect(() => {
    if (!property?.id) return;

    const channel = supabase
      .channel('collection-updates')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'collections',
          filter: `property_id=eq.${property.id}` 
        },
        (payload) => {
          if (payload.new.status === 'arrived') {
            toast.success("🚛 SpotlexWorld truck has arrived!", {
              description: "Our collection team is currently waiting at your gate.",
              duration: 15000,
            });
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [property?.id, supabase])

  if (!property) return null; 

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <BrandLogo />
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-green-600 uppercase tracking-widest shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-50 shadow-2xl shadow-slate-200/20 space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-2xl">
              <MapPin className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pickup Location</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic font-medium text-slate-600">
            {property.address_text}
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 space-y-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Calendar className="w-32 h-32" />
          </div>
          <h2 className="text-xl font-bold tracking-tight relative z-10">Schedule</h2>
          <div className="space-y-4 relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Collection Day</p>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <p className="text-2xl font-black italic">
                {property.collection_day_of_week !== null 
                  ?['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][property.collection_day_of_week] 
                  : "Pending Assignment"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}