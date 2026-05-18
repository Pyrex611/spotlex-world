import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { clientId, amountOwed, type } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: client } = await supabase.from('profiles').select('*').eq('id', clientId).single();
    if (!client) throw new Error('Client not found');

    const targetEmail = process.env.NODE_ENV === 'production' ? client.email : 'delivered@resend.dev';

    let subject = '';
    let htmlContent = '';

    if (type === 'demand') {
      subject = 'DEMAND NOTICE FOR PAYMENT - SpotlexWorld Waste Operations';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #dc2626; text-transform: uppercase;">Environmental Sanitation & Waste Management</h2>
          <p><strong>DEMAND NOTICE FOR THE PAYMENT FOR SERVICES RENDERED BY SPOTLEXWORLD</strong></p>
          <hr />
          <p>Dear ${client.full_name},</p>
          <p>SpotlexWorld, being the Government Licensed Waste Operator for your zone, has not been paid for waste evacuation services rendered to you.</p>
          <p><strong>Total Amount Owed: ₦${amountOwed.toLocaleString()}</strong></p>
          <p>By virtue of the Waste Management Authority Law, any person who fails or neglects to pay the prescribed tariff commits an offence.</p>
          <p>You should pay your arrears within 7 days of the receipt of this letter.</p>
          <p>Your failure to pay within the stated period will compel us, in the interest of public health, to institute appropriate lawful action against you for the recovery of the said sum without further recourse to you.</p>
          <div style="background: #f3f4f6; padding: 20px; border-left: 4px solid #059669; margin-top: 20px;">
             <p style="margin:0;"><strong>To prevent legal action, please login to your SpotlexWorld Dashboard and settle via Paystack immediately.</strong></p>
          </div>
          <p>Signed,<br/>Management, SpotlexWorld</p>
        </div>
      `;
    } else {
      subject = 'REMINDER OF SERVICE AGREEMENT - SpotlexWorld';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h2 style="color: #059669;">REMINDER OF SERVICE AGREEMENT</h2>
          <p>Dear ${client.full_name},</p>
          <p>We truly appreciate you for placing premium value on your HEALTH and public environmental health by choosing SpotlexWorld.</p>
          <p>We like to remind you of the service agreements still valid:</p>
          <ul>
            <li>You must package your waste decently in bags.</li>
            <li>Registration is personal and exclusive.</li>
            <li>We are duty-bound to collect only the volume agreed upon.</li>
          </ul>
          <p>We look forward to an upward and not awkward relationship with you!</p>
          <p>Yours Faithfully,<br/>Management, SpotlexWorld</p>
        </div>
      `;
    }

    const { error: emailError } = await resend.emails.send({
      from: 'SpotlexWorld Admin <onboarding@resend.dev>',
      to: [targetEmail],
      subject,
      html: htmlContent
    });

    if (emailError) throw emailError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}