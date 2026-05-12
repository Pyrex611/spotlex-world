'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(`Login failed: ${authError.message}`); setLoading(false); return; }
      if (data.user) {
        const role = data.user.user_metadata?.role || 'client'
        window.location.href = `/${role}/dashboard`
      }
    } catch (err: any) { setError('An unexpected error occurred.'); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
        <div className="text-center mb-10 flex flex-col items-center">
          <BrandLogo textSize="text-2xl" className="mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Sign in to your account</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl uppercase text-sm tracking-[0.2em] flex items-center justify-center transition-all disabled:opacity-50 mt-2 shadow-xl shadow-slate-200">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs font-bold text-slate-500 mt-8">
          Don&apos;t have an account? <Link href="/auth/register" className="text-green-600 hover:text-green-700 transition-colors">Register here</Link>
        </p>
      </div>
    </div>
  )
}