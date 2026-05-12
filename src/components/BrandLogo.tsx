'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
  textSize?: string
  dark?: boolean
}

export default function BrandLogo({ 
  className = "", 
  iconSize = 36, 
  showText = true,
  textSize = "text-xl",
  dark = false 
}: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 transition-opacity hover:opacity-90 select-none flex-shrink-0 ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white flex-shrink-0" 
        style={{ width: iconSize, height: iconSize }}
      >
        <Image 
          src="/spotlex_logo.jpg" 
          alt="SpotlexWorld Logo" 
          fill
          className="object-cover"
          sizes={`${iconSize}px`}
          priority
        />
      </div>
      
      {showText && (
        <span className={`font-black tracking-tight ${textSize} ${dark ? 'text-white' : 'text-slate-900'} hidden sm:block`}>
          Spotlex<span className="text-green-600 font-extrabold">World</span>
        </span>
      )}
    </Link>
  )
}