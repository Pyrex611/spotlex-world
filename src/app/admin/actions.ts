'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  
  const { data, error } = await supabase
    .from('properties')
    .update({
      location: `POINT(${lon} ${lat})`,
      address_text: finalAddress
    })
    .eq('id', id)
    .select()

  if (error) throw new Error("Failed to update location in database.")
  if (!data || data.length === 0) throw new Error("Update blocked by Database Security (RLS). Please apply the Admin SQL patch.")
  
  revalidatePath('/admin/dashboard')
}

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', id)
    .select()

  if (error) return { error: "Database error occurred." }
  if (!data || data.length === 0) return { error: "Update blocked by Database Security (RLS). Please apply the Admin SQL patch." }
  
  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
  return { success: true }
}

export async function updatePropertySchedule(propertyId: string, clientId: string, dayOfWeek: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .update({ collection_day_of_week: dayOfWeek })
    .eq('id', propertyId)
    .select()

  if (error) return { error: "Failed to update schedule in database." }
  if (!data || data.length === 0) return { error: "Action blocked by Database Security (RLS). Please apply the Admin SQL patch." }
  
  revalidatePath(`/admin/clients/${clientId}`)
  return { success: true }
}

export async function recordManualPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "Unauthorized." }

  const invoiceId = formData.get('invoice_id') as string
  const clientId = formData.get('client_id') as string
  const amount = Number(formData.get('amount'))
  const method = formData.get('payment_method') as string
  const reference = formData.get('reference') as string

  const { error: paymentError } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    client_id: clientId,
    amount: amount,
    payment_method: method, 
    reference: reference || `MANUAL-${Date.now()}`,
    recorded_by: user.id,
    status: 'success'
  });

  if (paymentError) return { error: paymentError.message };

  const { data: invoice } = await supabase.from('invoices').select('total_due').eq('id', invoiceId).single();
  const currentTotal = Number(invoice?.total_due || 0);
  
  const newStatus = amount >= currentTotal ? 'paid' : 'partial';

  await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
  
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/admin/dashboard');
  return { success: true };
}