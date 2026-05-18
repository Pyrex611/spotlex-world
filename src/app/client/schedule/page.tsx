import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import AddressGeocoder from '@/components/AddressGeocoder'

export default async function ClientSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: property } = await supabase.from('properties').select('*').eq('client_id', user.id).maybeSingle()

  const dayName = property?.collection_day_of_week !== null && property?.collection_day_of_week !== undefined
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][property.collection_day_of_week] 
    : "Pending Assignment"

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0 pb-10">
      <div className="flex items-center gap-6 py-4">
        <Link href="/client/dashboard" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Schedule & Location</h1>
          <p className="text-slate-500 font-medium text-sm">Manage where and when your waste is collected.</p>
        </div>
      </div>

      {!property ? (
        <AddressGeocoder />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Calendar className="w-32 h-32" /></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-4">Assigned Deployment Day</p>
              <h2 className="text-5xl font-black tracking-tighter mb-4">{dayName}s</h2>
              <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm">
                SpotlexWorld logistics calculates the most efficient day based on your zone. Please ensure your waste is properly bagged by 7:00 AM on this day.
              </p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-slate-100 p-3 rounded-2xl"><MapPin className="w-6 h-6 text-slate-700" /></div>
              <h3 className="text-xl font-black text-slate-900">Current GPS Pin</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic font-medium text-slate-600 leading-relaxed mb-6">
              {property.address_text}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900 mb-4">Relocate or Update Pin</p>
              <AddressGeocoder />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}