import { createClient } from '@/lib/supabase/server'
import { Users, Truck, CheckCircle2, Map as MapIcon, ClipboardList, ArrowUpRight, Star, Image as ImageIcon, MessageSquare } from 'lucide-react'
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
      outcome_reason,
      proof_photo_url,
      client_rating,
      client_remark,
      assistant_ids,
      driver:profiles!collections_driver_id_fkey(full_name)
    `)
    .eq('scheduled_date', today)

  const todayPropertyIds = activeCollections?.map(col => col.property_id) ||[]

  const { data: properties } = await supabase
    .from('properties')
    .select('id, address_text, location, client_id, profiles(full_name)')
    .not('location', 'is', null)

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Clean Mobile-Optimized Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Operational command and logistics for SpotlexWorld.</p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 w-fit">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <StatCard title="Today&apos;s Target" value={stats?.total_scheduled || 0} icon={<ClipboardList className="w-6 h-6" />} color="bg-slate-100 text-slate-900" />
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
             <AdminMapWrapper properties={properties ||[]} todayPropertyIds={todayPropertyIds} />
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
          <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-10 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-green-600 rounded-full"></div> Collection Monitor
          </h2>
          <div className="space-y-8 overflow-y-auto max-h-[550px] pr-4 custom-scrollbar">
            {activeCollections?.map((col) => (
              <div key={col.id} className="relative pl-6 border-l-2 border-slate-100 hover:border-green-500 transition-colors py-1 group">
                <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${col.status === 'collected' ? 'bg-green-600' : 'bg-slate-300'}`}></div>
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">SHIFT-LOG</p>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                     col.status === 'collected' ? 'bg-green-600 text-white' : 
                     col.status === 'no_answer' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {col.status.replace('_', ' ')}
                   </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{(col.driver as any)?.full_name || 'Autonomous'}</p>
                <p className="text-[10px] font-medium text-slate-400">Crew Size: 1 Driver + {col.assistant_ids?.length || 0} Assistant(s)</p>

                {(col.outcome_reason || col.proof_photo_url || col.client_rating) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {col.outcome_reason && (
                      <p className="text-[10px] font-medium text-slate-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                        <strong className="text-orange-800">Note:</strong> {col.outcome_reason}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {col.proof_photo_url && (
                        <a href={col.proof_photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded-md transition-colors">
                          <ImageIcon className="w-3 h-3" /> Proof Photo
                        </a>
                      )}
                      {col.client_rating && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 fill-yellow-500" /> {col.client_rating}/5
                        </div>
                      )}
                    </div>
                    {col.client_remark && (
                      <p className="text-[10px] font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="italic">&quot;{col.client_remark}&quot;</span>
                      </p>
                    )}
                  </div>
                )}
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