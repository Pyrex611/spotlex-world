import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const role = user.user_metadata?.role || 'client'
  
  // Instantly redirect to the correct dashboard based on role
  redirect(`/${role}/dashboard`)
}