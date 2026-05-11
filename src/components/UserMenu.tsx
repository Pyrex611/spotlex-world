'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface UserMenuProps {
  fullName: string;
  role: string;
}

export default function UserMenu({ fullName, role }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const initial = fullName ? fullName.charAt(0).toUpperCase() : 'U'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  },[])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to log out.')
    } else {
      router.push('/auth/login')
      router.refresh()
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-slate-50 border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-md">
          {initial}
        </div>
        <span className="text-sm font-bold text-slate-700 hidden md:block max-w-[100px] truncate">
          {fullName.split(' ')[0]}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[9999] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <p className="text-sm font-black text-slate-900 truncate">{fullName}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{role} Account</p>
          </div>
          <div className="p-2 space-y-1">
            <Link 
              href={`/${role}/profile`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <User className="w-4 h-4" /> My Profile
            </Link>
            <Link 
              href={`/${role}/profile`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-4 h-4" /> Account Settings
            </Link>
          </div>
          <div className="p-2 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Secure Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}