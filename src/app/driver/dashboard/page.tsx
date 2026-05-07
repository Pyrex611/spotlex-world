import { createClient } from '@/lib/supabase/server'
import DriverMapWrapper from '@/components/driver/DriverMapWrapper'
import BrandLogo from '@/components/BrandLogo'
import { Target, CheckCircle2, Clock } from 'lucide-react'

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const { data: collections } = await supabase
    .from('collections')
    .select(`
      id,
      status,
      properties (
        id,
        address_text,
        location,
        profiles ( full_name, email, phone )
      )
    `)
    .eq('scheduled_date', today)
    .eq('driver_id', user?.id)

  const { data: assistants } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'assistant')

  const total = collections?.length || 0;
  const collected = collections?.filter(c => c.status === 'collected').length || 0;
  const pending = total - collected;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Driver Terminal</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Shift Active: SpotlexWorld Operations</p>
          </div>
        </div>
        <BrandLogo showText={false} iconSize={24} />
      </header>

      {/* Driver Log Stats */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/20 border border-slate-50 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
          <div className="bg-slate-900 p-3 rounded-xl text-white"><Target size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled</p>
            <p className="text-2xl font-black text-slate-900">{total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/20 border border-slate-50 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-700"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Collected</p>
            <p className="text-2xl font-black text-slate-900">{collected}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/20 border border-slate-50 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-700"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-slate-900">{pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative">
         <DriverMapWrapper 
            collections={collections || []} 
            assistants={assistants ||[]}
            driverId={user?.id || ''}
            driverName={profile?.full_name || 'Spotlex Driver'}
         />
      </div>
    </div>
  )
}