import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text();

  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    const amountPaid = event.data.amount / 100;

    const supabase = await createClient();

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'success', paid_at: new Date().toISOString() })
      .eq('reference', reference)
      .select('*')
      .single();

    if (paymentError || !payment) {
      console.error('Webhook Error updating payment:', paymentError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    const { data: invoice } = await supabase.from('invoices').select('total_due').eq('id', payment.invoice_id).single();
    const newStatus = amountPaid >= Number(invoice?.total_due || 0) ? 'paid' : 'partial';

    await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', payment.invoice_id);

    return NextResponse.json({ success: true, message: 'Payment processed successfully' });
  }

  return NextResponse.json({ success: true, message: 'Event ignored' });
}