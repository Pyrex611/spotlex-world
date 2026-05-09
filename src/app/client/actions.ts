'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Saves or updates a client's property location using PostGIS geometry.
 */
export async function savePropertyLocation(address: string, lat: string, lon: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Unauthorized access. Please log in again.' }

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
    console.error('[DB Error] Location Save:', error)
    return { error: 'Failed to save property location. Please try again.' }
  }

  revalidatePath('/client/dashboard')
  return { success: true }
}

/**
 * Submits feedback for a completed waste collection event.
 */
export async function submitClientFeedback(collectionId: string, rating: number, remark: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized access. Please log in again.' }

  const { error } = await supabase
    .from('collections')
    .update({ 
      client_rating: rating,
      client_remark: remark
    })
    .eq('id', collectionId)

  if (error) {
    console.error('[DB Error] Feedback Submit:', error)
    return { error: 'Failed to submit feedback to the database.' }
  }
  
  revalidatePath('/client/dashboard')
  return { success: true }
}