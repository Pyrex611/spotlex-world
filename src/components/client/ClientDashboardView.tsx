'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, MapPin, Truck, Star, Image as ImageIcon, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitClientFeedback } from '@/app/client/actions'

function StarRating({ value, onChange, disabled }: { value: number, onChange?: (val: number) => void, disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange(star)}
          className={`focus:outline-none ${disabled ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}
        >
          <Star className={`w-6 h-6 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  )
}

export default function ClientDashboardView({ property, history }: { property: any, history: any[] }) {
  const supabase = createClient()
  const [arrivalNotification, setArrivalNotification] = useState<string | null>(null)
  
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [remark, setRemark] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!property?.id) return;

    const channel = supabase
      .channel('collection-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'collections', 
        filter: `property_id=eq.${property.id}` 
      },
      (payload) => {
        if (payload.new.status === 'arrived') {
          setArrivalNotification("Your SpotlexWorld truck has arrived at the gate!")
          toast.success("🚛 Truck Arrived!", { 
            description: "Our team is at your gate.", 
            duration: 15000 
          });
          setTimeout(() => setArrivalNotification(null), 20000)
        }
        if (payload.new.status === 'collected') {
          toast.success("✅ Waste Collected!", { 
            description: "Thank you for using SpotlexWorld." 
          });
          setTimeout(() => window.location.reload(), 2000);
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [property?.id, supabase])

  const handleFeedbackSubmit = (colId: string) => {
    if (rating === 0) { 
      toast.error("Please select a star rating."); 
      return; 
    }

    startTransition(async () => {
      const response = await submitClientFeedback(colId, rating, remark);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Feedback submitted. Thank you!");
        setActiveFeedbackId(null);
        window.location.reload(); 
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 px-4 md:px-0 pb-10">
      {arrivalNotification && (
        <div className="fixed top-28 right-6 left-6 md:left-auto md:w-[400px] z-[3000] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-green-500 flex items-center gap-6">
            <div className="bg-green-600 p-3 rounded-2xl animate-bounce">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Live Update</p>
              <p className="text-sm font-bold leading-tight">{arrivalNotification}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clean Mobile-Optimized Header (Logo removed to prevent duplication) */}
      <div className="flex justify-between items-center py-2 md:py-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight hidden md:block">Resident Dashboard</h1>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-green-600 uppercase tracking-widest shadow-sm flex items-center gap-2 w-fit">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active Service
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] border border-slate-50 shadow-2xl shadow-slate-200/20 space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-2xl"><MapPin className="w-6 h-6 text-green-700" /></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pickup Location</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic font-medium text-slate-600 leading-relaxed">
            {property.address_text}
          </div>
        </div>

        <div className="bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 space-y-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Calendar className="w-32 h-32" /></div>
          <h2 className="text-xl font-bold tracking-tight relative z-10">Schedule</h2>
          <div className="space-y-4 relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Collection Day</p>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <p className="text-2xl font-black italic">
                {property.collection_day_of_week !== null 
                  ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][property.collection_day_of_week] 
                  : "Pending Assignment"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
        <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service History</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Review past collections and provide feedback to our team.</p>
        </div>
        
        <div className="p-4 md:p-10 space-y-6">
          {history?.map((col: any) => (
            <div key={col.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">
                    {new Date(col.scheduled_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${col.status === 'collected' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                    {col.status.replace('_', ' ')}
                  </span>
                </div>
                {col.outcome_reason && (
                  <p className="text-sm font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-slate-900">Driver Note:</strong> {col.outcome_reason}
                  </p>
                )}
              </div>

              {col.proof_photo_url && (
                <a href={col.proof_photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 hover:border-green-400 transition-colors group">
                  <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-green-100 transition-colors"><ImageIcon className="w-5 h-5 text-slate-600 group-hover:text-green-700" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proof of Service</p>
                    <p className="text-sm font-bold text-slate-800">View Photo</p>
                  </div>
                </a>
              )}

              <div className="flex-1 lg:max-w-xs w-full">
                {col.client_rating ? (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating</p>
                    <StarRating value={col.client_rating} disabled />
                    {col.client_remark && <p className="text-xs font-medium text-slate-600 italic">"{col.client_remark}"</p>}
                  </div>
                ) : (
                  <>
                    {activeFeedbackId === col.id ? (
                      <div className="bg-white p-4 rounded-2xl border border-green-200 shadow-xl shadow-green-100 space-y-4 animate-in fade-in">
                        <StarRating value={rating} onChange={setRating} />
                        <textarea 
                          value={remark} 
                          onChange={(e) => setRemark(e.target.value)} 
                          placeholder="Add a remark (optional)..." 
                          className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-600 outline-none resize-none" 
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setActiveFeedbackId(null)} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                          <button 
                            onClick={() => handleFeedbackSubmit(col.id)} 
                            disabled={isPending} 
                            className="flex-1 bg-green-600 text-white py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2 transition active:scale-95 disabled:opacity-50"
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {setActiveFeedbackId(col.id); setRating(0); setRemark('');}} 
                        className="w-full bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-600 hover:text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" /> Leave Feedback
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No past collection logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}