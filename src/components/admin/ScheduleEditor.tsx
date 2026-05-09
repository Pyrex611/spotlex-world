'use client'

import { useState, useTransition } from 'react'
import { updatePropertySchedule } from '@/app/admin/actions'
import { Save, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const DAYS =['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleEditorProps {
  property: any;
  clientId: string;
}

export default function ScheduleEditor({ property, clientId }: ScheduleEditorProps) {
  const [isPending, startTransition] = useTransition()
  const[day, setDay] = useState<string>(property.collection_day_of_week?.toString() ?? '')

  const handleSave = () => {
    if (day === '') {
      toast.error("Please select a day of the week.")
      return
    }

    startTransition(async () => {
      const response = await updatePropertySchedule(property.id, clientId, parseInt(day))
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Schedule successfully assigned.")
      }
    })
  }

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group transition-colors hover:border-green-200">
      <div className="flex items-start gap-3 mb-6">
         <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
         <p className="text-sm font-bold text-slate-700 leading-relaxed pr-8">
           {property.address_text}
         </p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Collection Day</label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select 
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={isPending}
            className="w-full sm:flex-1 p-4 rounded-xl border-none bg-white shadow-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-600 appearance-none disabled:opacity-50"
          >
            <option value="" disabled>Select Day...</option>
            {DAYS.map((d, idx) => (
              <option key={idx} value={idx}>{d}</option>
            ))}
          </select>
          
          <button 
            onClick={handleSave}
            disabled={isPending || day === ''}
            className="w-full sm:w-auto bg-green-600 text-white p-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:active:scale-100 active:scale-95"
            title="Save Schedule"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}