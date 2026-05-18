import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializePaystackTransaction } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const { invoiceId, amount, email } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const reference = `SPLX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing?payment=success`;

    const paystackData = await initializePaystackTransaction(email, amount, reference, callbackUrl);

    const { error: dbError } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      client_id: user.id,
      amount: amount,
      payment_method: 'paystack',
      reference: reference,
      status: 'pending'
    });

    if (dbError) throw dbError;

    return NextResponse.json({ url: paystackData.authorization_url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}