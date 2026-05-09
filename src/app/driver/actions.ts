'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Initializes a driver's shift by assigning the selected assistants to today's collections.
 * Renamed to bust the Turbopack cache.
 */
export async function initializeDriverShift(collectionIds: string[], assistantIds: string[]) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('collections')
    .update({ assistant_ids: assistantIds })
    .in('id', collectionIds)

  if (error) {
    console.error('[DB Error] Shift Init:', error)
    return { error: 'Failed to synchronize shift data with the server.' }
  }
  
  revalidatePath('/driver/dashboard')
  return { success: true }
}

/**
 * Logs the final outcome (Collected, No Answer, etc.) and attaches photo proof.
 * Renamed to bust the Turbopack cache.
 */
export async function submitCollectionOutcome(
  collectionId: string, 
  status: 'collected' | 'no_answer' | 'other', 
  reason?: string, 
  photoUrl?: string
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('collections')
    .update({ 
      status: status,
      outcome_reason: reason || null,
      proof_photo_url: photoUrl || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', collectionId)

  if (error) {
    console.error('[DB Error] Outcome Submit:', error)
    return { error: 'Failed to record the collection outcome.' }
  }
  
  revalidatePath('/driver/dashboard')
  return { success: true }
}