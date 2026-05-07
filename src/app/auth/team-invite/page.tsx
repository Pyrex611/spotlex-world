'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, KeyRound, Loader2, ShieldCheck } from 'lucide-react'

const TEAM_ACCESS_CODE = 'SPOTLEX2026'

export default function TeamRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    accessCode: ''
  })
  const [error, setError] = useState<string | null>(null)
  const[loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.accessCode !== TEAM_ACCESS_CODE) {
      setError("Invalid Team Access Code.")
      return
    }

    setLoading(true)

    try {
      console.log('[Auth] Attempting driver registration for:', formData.email)
      
      // 1. Create the Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'driver'
          }
        }
      })

      if (authError) throw authError;

      if (authData.user) {
        console.log('[Auth] Auth account created. Creating driver profile...')
        
        // 2. Explicitly create the Public Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            role: 'driver'
          })

        if (profileError) {
          console.error('[DB Insert Error]', profileError)
          throw new Error(`Profile creation failed: ${profileError.message}`)
        }
      }

      console.log('[Auth] Complete driver registration successful!')
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/dashboard'), 2000)

    } catch (err: any) {
      console.error('[Registration Error]', err)
      setError(err.message || 'An unexpected internal error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border-t-4 border-blue-600">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-blue-100 p-3 rounded-full mb-3">
            <ShieldCheck className="w-8 h-8 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Driver Portal Setup</h1>
          <p className="text-slate-500 mt-1 text-sm">Authorized personnel only</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-6 text-center border border-blue-200">
            Account created! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.accessCode}
                onChange={(e) => setFormData({...formData, accessCode: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
                placeholder="Enter Authorization Code"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register as Driver'}
          </button>
        </form>
      </div>
    </div>
  )
}