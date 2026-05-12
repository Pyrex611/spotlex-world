import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Map, Truck, BellRing, ArrowRight } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans selection:bg-green-100 overflow-x-hidden">
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <BrandLogo />
          <div className="flex items-center gap-3 sm:gap-6">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 font-bold text-sm transition hidden sm:block">
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-slate-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.1] md:leading-[0.9] mb-6 md:mb-10">
              Waste pickup, <br className="hidden sm:block" />
              <span className="text-green-600 italic">reimagined.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-500 mb-10 md:mb-12 font-medium leading-relaxed px-2">
              SpotlexWorld streamlines urban hygiene with high-precision mapping and real-time logistics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <Link 
                href={user ? "/dashboard" : "/auth/register"} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 md:px-10 py-4 rounded-full font-black text-sm md:text-lg uppercase tracking-widest transition-all shadow-xl shadow-green-200 flex justify-center"
              >
                {user ? 'Enter Command Center' : 'Get Started Now'}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-20 md:mt-32 px-4">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-transform">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Precision Geocoding</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Pinpoint your exact address on our interactive map. Our drivers use advanced spatial routing to find your home without confusion.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-transform">
              <div className="bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-green-100">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Optimized Routing</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Our administrative engine calculates the fastest route, minimizing fuel and maximizing collection efficiency automatically.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:-translate-y-2 transition-transform sm:col-span-2 lg:col-span-1">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-orange-100">
                <BellRing className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Real-time Alerts</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Receive instant emails and dashboard notifications the moment our trucks arrive at your gate. No more waiting outside.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-100 py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-white">
        <p>&copy; {new Date().getFullYear()} SpotlexWorld. All rights reserved.</p>
      </footer>
    </div>
  )
}