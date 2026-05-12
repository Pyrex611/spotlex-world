'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, KeyRound, Loader2 } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

const TEAM_ACCESS_CODE = 'SPOTLESS2026'

export default function TeamRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', accessCode: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (formData.accessCode !== TEAM_ACCESS_CODE) { setError("Invalid Team Access Code."); return }
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email, password: formData.password, options: { data: { full_name: formData.fullName, role: 'driver' } }
      })
      if (authError) throw authError;
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, full_name: formData.fullName, role: 'driver' })
        if (profileError) throw new Error(profileError.message)
      }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) { setError(err.message || 'An unexpected error occurred.') } 
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border-t-8 border-green-600">
        <div className="text-center mb-10 flex flex-col items-center">
          <BrandLogo textSize="text-2xl" className="mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Driver Portal</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Authorized personnel setup</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold mb-6 text-center border border-green-200">Account created! Redirecting...</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Code</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="text" required value={formData.accessCode} onChange={(e) => setFormData({...formData, accessCode: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none uppercase" placeholder="Enter Code" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading || success} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl uppercase text-sm tracking-[0.2em] flex items-center justify-center transition-all disabled:opacity-50 mt-2 shadow-xl shadow-green-900/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Driver'}
          </button>
        </form>
      </div>
    </div>
  )
}