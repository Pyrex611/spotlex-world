import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ShieldCheck, CalendarDays, Receipt, Clock, MapPin, AlertCircle, CheckCircle2, Wallet, FileText } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'
import ScheduleEditor from '@/components/admin/ScheduleEditor'
import ClientProfileEditor from '@/components/admin/ClientProfileEditor'
import ManualPaymentManager from '@/components/admin/ManualPaymentManager'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // 1. Fetch Client & Properties
  const { data: client } = await supabase
    .from('profiles')
    .select('*, properties(*)')
    .eq('id', id)
    .single();

  if (!client) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Account not found.</h2>
        <Link href="/admin/clients" className="text-green-600 font-bold underline mt-4 inline-block">Return to Registry</Link>
      </div>
    );
  }

  const propertyIds = client.properties ? (client.properties as any[]).map(p => p.id) : [];

  // 2. Fetch Financials (All Invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .order('due_date', { ascending: false });

  const allInvoices = invoices || [];
  const unpaidInvoices = allInvoices.filter(inv => inv.status !== 'paid');
  const totalArrears = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_due), 0);

  // 3. Fetch Service History
  const { data: history } = await supabase
    .from('collections')
    .select('*, driver:profiles!collections_driver_id_fkey(full_name)')
    .in('property_id', propertyIds.length ? propertyIds : ['00000000-0000-0000-0000-000000000000'])
    .order('scheduled_date', { ascending: false })
    .limit(10); // Show last 10 logs

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0 pb-12">
      
      {/* Header & Global Alert */}
      <div className="flex items-center gap-6 py-4">
        <Link href="/admin/clients" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{client.full_name}</h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
              <span className="uppercase tracking-widest text-[10px] font-black">ID: {client.id.split('-')[0]}</span>
              &bull;
              <span>{client.phone || 'No phone recorded'}</span>
            </p>
          </div>
          {totalArrears > 0 ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Action Required</p>
                <p className="text-sm font-bold">Account in Arrears</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Good Standing</p>
                <p className="text-sm font-bold">All Bills Settled</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Logistics & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Stats Bento Row */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10"><Wallet className="w-24 h-24" /></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
               <h2 className="text-3xl font-black tracking-tighter">₦{totalArrears.toLocaleString()}</h2>
             </div>
             <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Properties</p>
               <h2 className="text-3xl font-black tracking-tighter text-slate-900">{(client.properties as any[]).length}</h2>
             </div>
          </div>

          {/* Profile Editor */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-10 relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-32 h-32 text-slate-900" /></div>
            <h2 className="text-xl font-black text-slate-900 mb-8">Client Bio-Data</h2>
            <ClientProfileEditor client={client} />
          </div>

          {/* Deployment Schedule */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-10 h-fit">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-green-100 p-3 rounded-2xl"><CalendarDays className="w-6 h-6 text-green-700" /></div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Deployment Schedule</h2>
            </div>
            <div className="space-y-6">
              {(client.properties as any[])?.map((prop) => (
                <ScheduleEditor key={prop.id} property={prop} clientId={client.id} />
              ))}
              {(!client.properties || (client.properties as any[]).length === 0) && (
                <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                   <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Linked Property</p>
                </div>
              )}
            </div>
          </div>

          {/* Service History Log */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-10 h-fit">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-3 rounded-2xl"><Clock className="w-6 h-6 text-blue-700" /></div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Service Logs</h2>
            </div>
            
            <div className="space-y-6">
              {history && history.length > 0 ? history.map((log: any) => (
                <div key={log.id} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${log.status === 'collected' ? 'bg-green-500' : log.status === 'no_answer' ? 'bg-orange-500' : 'bg-slate-400'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(log.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {log.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Driver: {(log.driver as any)?.full_name || 'Autonomous'}
                    </p>
                    {(log.outcome_reason || log.client_rating) && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        {log.outcome_reason && <p className="text-xs text-slate-600"><strong className="text-slate-900">Note:</strong> {log.outcome_reason}</p>}
                        {log.client_rating && <p className="text-xs text-yellow-600 font-bold">Client Rating: {log.client_rating}/5 stars</p>}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No service history recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Operations */}
        <div className="space-y-8 h-fit lg:sticky lg:top-24">
          
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 text-white">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700">
                <Receipt className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Clear Payments</h2>
            </div>
            
            <ManualPaymentManager clientId={client.id} unpaidInvoices={unpaidInvoices} />
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8">
             <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500">Invoice Ledger</h3>
             </div>
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {allInvoices.length > 0 ? allInvoices.map((inv) => (
                 <Link href={`/client/billing/${inv.id}`} key={inv.id} target="_blank" className="block bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-green-300 transition-colors group">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-black text-slate-900">{new Date(inv.month_year + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                      <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-lg font-mono font-black text-slate-900">₦{Number(inv.total_due).toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-green-600 transition-colors">View &rarr;</span>
                    </div>
                 </Link>
               )) : (
                 <p className="text-center text-xs font-bold text-slate-400">No invoices generated.</p>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}