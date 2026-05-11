'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePersonalProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized." }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  // 1. Update Public Profile Table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)

  if (profileError) return { error: "Failed to update profile data." }

  // 2. Update Auth Metadata (So the UserMenu reflects changes instantly)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name, phone }
  })

  if (authError) return { error: "Failed to update auth identity." }

  return { success: true }
}

export async function updateAccountPassword(formData: FormData) {
  const supabase = await createClient()
  const new_password = formData.get('new_password') as string

  const { error } = await supabase.auth.updateUser({
    password: new_password
  })

  if (error) return { error: error.message }
  return { success: true }
}