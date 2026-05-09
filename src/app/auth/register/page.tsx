'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const[formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const[loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create the Auth User & Pass metadata (including the new phone field)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'client'
          }
        }
      })

      if (authError) throw authError;

      if (authData.user) {
        // 2. Explicitly create the Public Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'client'
          })

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`)
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)

    } catch (err: any) {
      setError(err.message || 'An unexpected internal error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100">
        <div className="text-center mb-10 flex flex-col items-center">
          <BrandLogo textSize="text-2xl" className="mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Join the premium waste management platform.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold mb-6 text-center border border-green-200">
            Registration successful! Redirecting to setup...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="John Doe" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="0801 234 5678" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="you@example.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
              <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none" placeholder="••••••••" />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading || success} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl uppercase text-sm tracking-[0.2em] flex items-center justify-center transition-all disabled:opacity-50 shadow-xl shadow-slate-200">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join SpotlexWorld'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs font-bold text-slate-500 mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-green-600 hover:text-green-700 transition-colors">Sign in securely</Link>
        </p>
      </div>
    </div>
  )
}