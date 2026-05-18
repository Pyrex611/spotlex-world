import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import HistoryFeedbackClient from './HistoryFeedbackClient'

export default async function ClientHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: property } = await supabase.from('properties').select('id').eq('client_id', user.id).single()
  
  const { data: history } = await supabase
    .from('collections')
    .select('*')
    .eq('property_id', property?.id)
    .neq('status', 'pending')
    .order('scheduled_date', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
      <div className="flex items-center gap-6 py-4">
        <Link href="/client/dashboard" className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service History</h1>
          <p className="text-slate-500 font-medium text-sm">Review logs and rate our drivers.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        {(!history || history.length === 0) ? (
          <div className="text-center py-24 bg-slate-50">
             <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No service records yet.</p>
          </div>
        ) : (
          <HistoryFeedbackClient history={history} />
        )}
      </div>
    </div>
  )
}