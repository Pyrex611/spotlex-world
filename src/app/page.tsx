import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Leaf, Map, Truck, BellRing, ArrowRight } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  // Check if a user is currently logged in
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700">
            <Leaf className="w-8 h-8" />
            <span className="text-2xl font-black tracking-tight">SpotlexWorld</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-semibold transition shadow-md shadow-green-200 flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-green-700 font-semibold px-4 py-2 transition">
                  Log In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-semibold transition shadow-md shadow-green-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-green-50 border border-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-6">
              SMART WASTE MANAGEMENT
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-8">
              A Cleaner City, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">
                Delivered Smartly.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Spotless World connects residents with waste collection teams using real-time GPS routing, instant notifications, and proof of collection to ensure your neighborhood stays pristine.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-xl shadow-green-200 flex items-center justify-center gap-2"
                >
                  Enter Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/register" 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-xl shadow-green-200"
                  >
                    Register as Resident
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="w-full sm:w-auto bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-4 rounded-full font-bold text-lg transition"
                  >
                    Team Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 md:mt-32">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Precision Geocoding</h3>
              <p className="text-gray-500 leading-relaxed">
                Pinpoint your exact address on our interactive map. Our drivers use advanced spatial routing to find your home without confusion.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimized Routing</h3>
              <p className="text-gray-500 leading-relaxed">
                Our administrative engine calculates the fastest Traveling Salesperson route, minimizing fuel and maximizing collection efficiency.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <BellRing className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Alerts</h3>
              <p className="text-gray-500 leading-relaxed">
                Receive instant emails and dashboard notifications the moment our trucks arrive at your gate. No more waiting outside.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} SpotlexWorld. All rights reserved.</p>
      </footer>
    </div>
  )
}