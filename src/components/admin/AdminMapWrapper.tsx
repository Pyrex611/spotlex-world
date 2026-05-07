'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

interface AdminMapWrapperProps {
  properties: any[]
  todayPropertyIds: string[]
}

export default function AdminMapWrapper({ properties, todayPropertyIds }: AdminMapWrapperProps) {
  const GlobalAdminMap = useMemo(() => dynamic(
    () => import('./GlobalAdminMap'),
    { 
      ssr: false,
      loading: () => (
        <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center animate-pulse">
           <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
           <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Waking Up Satellite Maps...</p>
        </div>
      )
    }
  ), [])

  return <GlobalAdminMap properties={properties} todayPropertyIds={todayPropertyIds} />
}