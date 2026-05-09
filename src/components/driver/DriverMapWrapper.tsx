'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useTransition } from 'react'
import { Truck, Play, Loader2, UserPlus, CheckSquare, Square } from 'lucide-react'
import { initializeDriverShift } from '@/app/driver/actions'
import { toast } from 'sonner'

interface DriverMapWrapperProps {
  collections: any[];
  assistants: any[];
  driverId: string;
  driverName: string;
}

export default function DriverMapWrapper({ collections, assistants, driverId, driverName }: DriverMapWrapperProps) {
  const [isShiftStarted, setIsShiftStarted] = useState(false)
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const RouteMap = useMemo(() => dynamic(() => import('./RouteMap'), { 
      ssr: false,
      loading: () => (
        <div className="h-[500px] md:h-[650px] w-full bg-slate-50 flex flex-col items-center justify-center animate-pulse rounded-[2rem]">
           <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center">Resolving Urban Routes...</p>
        </div>
      )
  }),[])

  const toggleAssistant = (id: string) => {
    setSelectedAssistants(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleStartShift = () => {
    const colIds = collections.map(c => c.id)
    
    startTransition(async () => {
      if (colIds.length > 0) {
        const result = await initializeDriverShift(colIds, selectedAssistants)
        if (result.error) {
          toast.error(result.error)
          return
        }
      }
      setIsShiftStarted(true)
      toast.success("Shift Initialized Successfully.")
    })
  }

  if (!isShiftStarted) {
    return (
      <div className="h-[500px] md:h-[650px] w-full bg-slate-900 flex items-center justify-center p-6 text-center rounded-[2rem]">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="bg-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-900">
            <Truck size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shift Initialization</h2>
            <p className="text-slate-500 text-sm mt-2">Select your crew members for today&apos;s route. You can select multiple assistants or proceed alone.</p>
          </div>

          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <UserPlus size={14}/> Available Assistants
            </label>
            <div className="bg-slate-50 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1">
              {assistants.length === 0 && <p className="p-4 text-xs font-bold text-slate-400 text-center">No assistants available.</p>}
              {assistants.map((asst) => {
                const isSelected = selectedAssistants.includes(asst.id);
                return (
                  <button
                    key={asst.id}
                    onClick={() => toggleAssistant(asst.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected ? 'bg-green-100 text-green-900' : 'hover:bg-slate-200 text-slate-600'}`}
                  >
                    {isSelected ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                    <span className="font-bold text-sm">{asst.full_name}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center italic">Leave empty to proceed with No Assistant.</p>
          </div>

          <button 
            disabled={isPending}
            onClick={handleStartShift}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-white" /> Start Shift</>}
          </button>
        </div>
      </div>
    )
  }

  return <RouteMap collections={collections} driverId={driverId} driverName={driverName} />
}