'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-600 hover:text-red-800 transition px-3 py-2 rounded-md hover:bg-red-50 font-medium"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  )
}