import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ShieldCheck, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import ScheduleEditor from '@/components/admin/ScheduleEditor'
import ClientProfileEditor from '@/components/admin/ClientProfileEditor'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  
  const { data: client } = await supabase
    .from('profiles')
    .select('*, properties(*)')
    .eq('id', id)
    .single()

  if (!client) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Account not found.</h2>
        <Link href="/admin/clients" className="text-green-600 font-bold underline mt-4 inline-block">Return to Registry</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-0">
      <div className="flex items-center gap-6">
        <Link href="/admin/clients" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-xl hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <BrandLogo />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Modification Section */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldCheck className="w-32 h-32 text-slate-900" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-2">Modify Profile</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">System ID: {client.id.split('-')[0]}</p>
          
          <ClientProfileEditor client={client} />
        </div>

        {/* Collection Scheduling Section */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 h-fit">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-green-100 p-3 rounded-2xl">
              <CalendarDays className="w-6 h-6 text-green-700" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Deployment Schedule</h1>
          </div>

          <div className="space-y-6">
            {(client.properties as any[])?.map((prop) => (
              <ScheduleEditor key={prop.id} property={prop} clientId={client.id} />
            ))}
            
            {(!client.properties || (client.properties as any[]).length === 0) && (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Linked Property</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}