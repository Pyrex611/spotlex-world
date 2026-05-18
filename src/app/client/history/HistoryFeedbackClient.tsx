'use client'

import { useState, useTransition } from 'react'
import { Star, MessageSquare, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { submitClientFeedback } from '@/app/client/actions'

function StarRating({ value, onChange, disabled }: { value: number, onChange?: (val: number) => void, disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={disabled} onClick={() => onChange && onChange(star)} className={`focus:outline-none ${disabled ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}>
          <Star className={`w-6 h-6 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  )
}

export default function HistoryFeedbackClient({ history }: { history: any[] }) {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [remark, setRemark] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleFeedbackSubmit = (colId: string) => {
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    startTransition(async () => {
      const response = await submitClientFeedback(colId, rating, remark);
      if (response.error) toast.error(response.error);
      else { 
        toast.success("Feedback submitted!"); 
        setActiveFeedbackId(null);
      }
    });
  }

  return (
    <div className="divide-y divide-slate-50">
      {history.map((col) => (
        <div key={col.id} className="p-8 md:p-10 flex flex-col md:flex-row gap-8 justify-between hover:bg-slate-50/50 transition-colors">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-900">
                {new Date(col.scheduled_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${col.status === 'collected' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {col.status.replace('_', ' ')}
              </span>
            </div>
            {col.outcome_reason && (
              <p className="text-sm font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block">
                <strong className="text-slate-900 text-xs uppercase tracking-widest block mb-1">Driver Note</strong> {col.outcome_reason}
              </p>
            )}
            {col.proof_photo_url && (
              <a href={col.proof_photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-800 transition-colors">
                <ImageIcon className="w-4 h-4" /> View Proof of Service
              </a>
            )}
          </div>
          <div className="w-full md:w-72 flex-shrink-0">
            {col.client_rating ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating</p>
                <StarRating value={col.client_rating} disabled />
                {col.client_remark && <p className="text-xs font-medium text-slate-600 italic leading-relaxed">"{col.client_remark}"</p>}
              </div>
            ) : (
              <>
                {activeFeedbackId === col.id ? (
                  <div className="bg-white p-5 rounded-2xl border border-green-200 shadow-xl shadow-green-100 space-y-4 animate-in fade-in">
                    <StarRating value={rating} onChange={setRating} />
                    <textarea 
                      value={remark} onChange={(e) => setRemark(e.target.value)} 
                      placeholder="Add a remark (optional)..." 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-600 outline-none resize-none" 
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setActiveFeedbackId(null)} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                      <button onClick={() => handleFeedbackSubmit(col.id)} disabled={isPending} className="flex-1 bg-green-600 text-white py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2 transition active:scale-95 disabled:opacity-50">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => {setActiveFeedbackId(col.id); setRating(0); setRemark('');}} className="w-full bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-600 hover:text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <MessageSquare className="w-4 h-4" /> Rate Service
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}