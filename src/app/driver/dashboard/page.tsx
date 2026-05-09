import { createClient } from '@/lib/supabase/server'
import DriverMapWrapper from '@/components/driver/DriverMapWrapper'
import BrandLogo from '@/components/BrandLogo'
import { Target, CheckCircle2, Clock, WifiOff, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const dayOfWeek = todayDate.getDay() 

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Authentication failed")

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: scheduledProps } = await supabase
      .from('properties')
      .select('id')
      .eq('collection_day_of_week', dayOfWeek)

    if (scheduledProps && scheduledProps.length > 0) {
      const { data: existingCols } = await supabase
        .from('collections')
        .select('property_id')
        .eq('scheduled_date', todayStr)

      const existingIds = existingCols?.map(c => c.property_id) ||[]
      const missingProps = scheduledProps.filter(p => !existingIds.includes(p.id))

      if (missingProps.length > 0) {
        const inserts = missingProps.map(p => ({
          property_id: p.id,
          scheduled_date: todayStr,
          status: 'pending'
        }))
        await supabase.from('collections').insert(inserts)
      }
    }

    // FIXED: Removed 'email' from the profiles relation select query
    const { data: collections, error: colError } = await supabase
      .from('collections')
      .select(`
        id,
        status,
        driver_id,
        properties (
          id,
          address_text,
          location,
          profiles ( full_name, phone )
        )
      `)
      .eq('scheduled_date', todayStr)
      .or(`driver_id.is.null,driver_id.eq.${user.id}`)

    if (colError) throw colError;

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

  } catch (error) {
    console.error("[Driver Dashboard] Data Fetch Error:", error);
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-lg w-full">
          <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Connection Lost</h2>
          <p className="text-slate-500 font-medium mb-8">
            The server cannot reach the SpotlexWorld database. This is usually caused by a temporary network drop or DNS timeout.
          </p>
          <Link href="/driver/dashboard" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
            <RefreshCcw className="w-4 h-4" /> Retry Connection
          </Link>
        </div>
      </div>
    )
  }
}