import { createClient } from '@/lib/supabase/server'
import ProfileSettings from '@/components/ProfileSettings'

export default async function AdminProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administrator Profile</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your command center credentials.</p>
      </div>
      {profile && <ProfileSettings profile={profile} />}
    </div>
  )
}