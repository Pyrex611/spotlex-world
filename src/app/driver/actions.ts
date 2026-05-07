'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startDriverShift(collectionIds: string[], assistantIds: string[]) {
  const supabase = await createClient()
  
  // Assign the selected assistants to all of today's collections for this driver
  const { error } = await supabase
    .from('collections')
    .update({ assistant_ids: assistantIds })
    .in('id', collectionIds)

  if (error) throw new Error("Failed to initialize shift.")
  
  revalidatePath('/driver/dashboard')
}