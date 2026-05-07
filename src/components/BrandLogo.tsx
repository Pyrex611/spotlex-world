'use client'

import { Leaf } from 'lucide-react'

interface LogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
  textSize?: string
  dark?: boolean
}

export default function BrandLogo({ 
  className = "", 
  iconSize = 20, 
  showText = true,
  textSize = "text-xl",
  dark = false 
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 transition-opacity hover:opacity-90 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* The Base Logo Shape */}
        <div className="bg-green-600 p-1.5 rounded-lg shadow-lg shadow-green-900/20">
          <Leaf 
            size={iconSize} 
            className="text-white fill-white/20" 
            strokeWidth={2.5}
          />
        </div>
        {/* Aesthetic Dot for Premium Look */}
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-900 rounded-full border-2 border-white"></div>
      </div>
      
      {showText && (
        <span className={`font-black tracking-tight ${textSize} ${dark ? 'text-white' : 'text-slate-900'}`}>
          Spotlex<span className="text-green-600 font-extrabold">World</span>
        </span>
      )}
    </div>
  )
}