import { createClient } from '@/lib/supabase/server'
import { Users, Truck, CheckCircle2, Map as MapIcon, ClipboardList, ArrowUpRight } from 'lucide-react'
import AdminMapWrapper from '@/components/admin/AdminMapWrapper'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = await supabase.from('daily_stats').select('*').eq('scheduled_date', today).single()
  const { count: totalClients } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client')
  
  const { data: activeCollections } = await supabase
    .from('collections')
    .select(`
      id, 
      status, 
      property_id,
      driver:profiles!collections_driver_id_fkey(full_name),
      assistant:profiles!collections_assistant_id_fkey(full_name)
    `)
    .eq('scheduled_date', today)

  const todayPropertyIds = activeCollections?.map(col => col.property_id) || []

  const { data: properties } = await supabase
    .from('properties')
    .select('id, address_text, location, client_id, profiles(full_name)')
    .not('location', 'is', null)

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Operational command and logistics for SpotlexWorld.</p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* FIXED: Outer Link with inner content */}
        <Link href="/admin/clients">
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-green-200 cursor-pointer group">
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg transition-colors group-hover:bg-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                Residents <ArrowUpRight className="w-3.5 h-3.5 text-green-600 opacity-0 group-hover:opacity-100 transition-all" />
              </p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{totalClients || 0}</p>
            </div>
          </div>
        </Link>

        <StatCard title="Today's Target" value={stats?.total_scheduled || 0} icon={<ClipboardList className="w-6 h-6" />} color="bg-slate-100 text-slate-900" />
        <StatCard title="Completed" value={stats?.total_fulfilled || 0} icon={<CheckCircle2 className="w-6 h-6" />} color="bg-green-100 text-green-700" />
        <StatCard title="Active Shifts" value={stats?.active_drivers || 0} icon={<Truck className="w-6 h-6" />} color="bg-orange-100 text-orange-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 bg-white p-2 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative group">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest">Global Asset Map</h2>
            </div>
          </div>
          <div className="h-[500px] md:h-[650px] w-full rounded-[2.5rem] overflow-hidden border border-slate-50">
             <AdminMapWrapper 
                properties={properties || []} 
                todayPropertyIds={todayPropertyIds} 
              />
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-10 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-green-600 rounded-full"></div> Collection Monitor
          </h2>
          <div className="space-y-8 overflow-y-auto max-h-[550px] pr-4 custom-scrollbar">
            {activeCollections?.map((col) => (
              <div key={col.id} className="relative pl-6 border-l-2 border-slate-100 hover:border-green-500 transition-colors py-1">
                <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${col.status === 'collected' ? 'bg-green-600' : 'bg-slate-300'}`}></div>
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">SHIFT-LOG</p>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                     col.status === 'collected' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                   }`}>{col.status}</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{(col.driver as any)?.full_name || 'Autonomous'}</p>
                <p className="text-[10px] font-medium text-slate-400">Helper: {(col.assistant as any)?.full_name || 'None Assigned'}</p>
              </div>
            ))}
            {activeCollections?.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/10 flex items-center gap-6">
      <div className={`${color} p-4 rounded-2xl shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  )
}