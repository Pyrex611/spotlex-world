'use client'

import { User, Phone, Save, Loader2 } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateClientProfile } from '@/app/admin/actions'

export default function ClientProfileEditor({ client }: { client: any }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updateClientProfile(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated successfully")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
      <input type="hidden" name="id" value={client.id} />
      
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
        <div className="relative group">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
          <input 
            name="full_name"
            defaultValue={client.full_name}
            required
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none shadow-inner"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Phone</label>
        <div className="relative group">
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-600" />
          <input 
            name="phone"
            defaultValue={client.phone || ''}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-green-600 transition-all outline-none shadow-inner"
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={isPending}
          className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Commit Changes</>}
        </button>
      </div>
    </form>
  )
}