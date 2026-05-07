import { createClient } from '@/lib/supabase/server'
import { MapPin, ChevronRight, ArrowLeft, Phone, Edit3 } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

export default async function AdminClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      properties (
        id,
        address_text
      )
    `)
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BrandLogo textSize="text-2xl" />
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
           <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{clients?.length || 0} Registered Clients</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone & Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Address</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Registry Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients?.map((client) => {
                const primaryProperty = (client.properties as any[])?.[0];
                return (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                          {client.full_name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{client.full_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                       <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-green-600" />
                          {client.phone || 'N/A'}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      {primaryProperty ? (
                        <div className="flex items-start gap-2 max-w-sm">
                          <MapPin className="w-4 h-4 text-slate-300 mt-0.5" />
                          <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                            {primaryProperty.address_text}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Property Assigned</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {primaryProperty && (
                          <Link 
                            href={`/admin/dashboard?editId=${primaryProperty.id}`}
                            className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            title="Map View"
                          >
                            <MapPin className="w-4 h-4" />
                          </Link>
                        )}
                        <Link 
                          href={`/admin/clients/${client.id}`}
                          className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}