'use client'

import { useState, useTransition } from 'react'
import { User, Phone, Lock, Save, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { updatePersonalProfile, updateAccountPassword } from '@/app/profile/actions'

interface ProfileSettingsProps {
  profile: {
    full_name: string;
    phone: string;
    email: string;
    role: string;
  }
}

export default function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startProfileTransition(async () => {
      const response = await updatePersonalProfile(formData)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Profile updated successfully.")
      }
    })
  }

  const handlePasswordUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startPasswordTransition(async () => {
      const response = await updateAccountPassword(formData)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success("Password updated successfully.")
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
      
      {/* Personal Info Card */}
      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Personal Details</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input disabled value={profile.email || ''} className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-slate-500 font-bold outline-none cursor-not-allowed" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input name="full_name" defaultValue={profile.full_name} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-green-600 transition-all shadow-inner" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input name="phone" defaultValue={profile.phone || ''} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-green-600 transition-all shadow-inner" />
            </div>
          </div>

          <button disabled={isProfilePending} type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4">
            {isProfilePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Details</>}
          </button>
        </form>
      </div>

      {/* Security Card */}
      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Security</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input name="new_password" type="password" required minLength={6} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-green-600 transition-all shadow-inner" placeholder="••••••••" />
            </div>
          </div>

          <button disabled={isPasswordPending} type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {isPasswordPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Update Password</>}
          </button>
        </form>
      </div>

    </div>
  )
}