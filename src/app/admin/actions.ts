'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updatePropertyLocation(id: string, lat: number, lon: number, manualAddress?: string) {
  const supabase = await createClient()
  let finalAddress = manualAddress;
  if (!finalAddress) {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'SpotlexWorld/1.0' }
    })
    const data = await res.json()
    finalAddress = data.display_name || 'Updated by Admin'
  }
  const { error } = await supabase.from('properties').update({
    location: `POINT(${lon} ${lat})`,
    address_text: finalAddress
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/admin/dashboard')
}

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/clients')
  redirect('/admin/clients')
}

export async function updatePropertySchedule(propertyId: string, clientId: string, dayOfWeek: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('properties')
    .update({ collection_day_of_week: dayOfWeek })
    .eq('id', propertyId)

  if (error) throw new Error("Failed to update schedule.")
  
  // Revalidate to instantly update the UI
  revalidatePath(`/admin/clients/${clientId}`)
}