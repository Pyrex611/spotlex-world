'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePropertyLocation(address: string, lat: string, lon: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const pointGeometry = `POINT(${lon} ${lat})`

  const { error } = await supabase
    .from('properties')
    .insert({
      client_id: user.id,
      address_text: address,
      location: pointGeometry,
      collection_day_of_week: null 
    })

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to save property location.')
  }

  revalidatePath('/client/dashboard')
}