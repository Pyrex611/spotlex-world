import LogoutButton from '@/components/LogoutButton'
import { Truck } from 'lucide-react'
import { ReactNode } from 'react'

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700">
            <Truck className="w-6 h-6" />
            <h1 className="text-xl font-bold">Driver Terminal</h1>
          </div>
          <nav>
            <LogoutButton />
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  )
}