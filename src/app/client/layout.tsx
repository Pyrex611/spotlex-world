import LogoutButton from '@/components/LogoutButton'
import { Leaf } from 'lucide-react'
import { ReactNode } from 'react'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-800">
            <Leaf className="w-5 h-5 fill-green-600" />
            <h1 className="text-lg font-bold tracking-tight">SpotlexWorld</h1>
          </div>
          <LogoutButton />
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {children}
      </main>
    </div>
  )
}