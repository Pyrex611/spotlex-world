import LogoutButton from '@/components/LogoutButton'
import BrandLogo from '@/components/BrandLogo'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-[1001] px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <BrandLogo />
          <nav className="flex items-center gap-6">
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <LogoutButton />
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-10 w-full animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  )
}