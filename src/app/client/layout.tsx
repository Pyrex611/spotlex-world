import { createClient } from '@/lib/supabase/server'
import UserMenu from '@/components/UserMenu'
import BrandLogo from '@/components/BrandLogo'
import { ReactNode } from 'react'

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm sticky top-0 z-[1001] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <BrandLogo />
          {profile && (
            <UserMenu fullName={profile.full_name} role={profile.role} />
          )}
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto py-10 w-full">
        {children}
      </main>
    </div>
  )
}