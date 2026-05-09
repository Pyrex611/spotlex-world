import { createClient } from '@/lib/supabase/server'
import AddressGeocoder from '@/components/AddressGeocoder'
import ClientDashboardView from '@/components/client/ClientDashboardView'
import 'leaflet/dist/leaflet.css'

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Use maybeSingle() to prevent the 500 error on new accounts
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('client_id', user.id)
    .maybeSingle()

  // If no property exists, render the Onboarding & Setup Flow
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome to SpotlexWorld</h1>
          <p className="text-slate-500 font-medium">Let's get started by setting your verified pickup location.</p>
        </div>
        <AddressGeocoder />
      </div>
    )
  }

  // If property exists, fetch history for the feedback loop
  const today = new Date().toISOString().split('T')[0]
  const { data: history } = await supabase
    .from('collections')
    .select('*')
    .eq('property_id', property.id)
    .neq('status', 'pending')
    .lte('scheduled_date', today)
    .order('scheduled_date', { ascending: false })

  return (
    <div className="animate-in fade-in duration-1000">
      <ClientDashboardView property={property} history={history ||[]} />
    </div>
  )
}